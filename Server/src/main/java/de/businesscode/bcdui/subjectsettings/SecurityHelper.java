/*
  Copyright 2010-2017 BusinessCode GmbH, Germany

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
package de.businesscode.bcdui.subjectsettings;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.mgt.DefaultSecurityManager;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.subject.Subject;

import de.businesscode.bcdui.subjectsettings.config.Security;
import de.businesscode.bcdui.subjectsettings.config.Security.Operation;
import de.businesscode.bcdui.toolbox.Configuration;

/**
 * helper to evaluate shiro security on {@link Security} settings
 */
public class SecurityHelper {

  /**
   * checks current security context of the user for given operation. Security
   * is retrieved via SecurityUtils provided by shiro. Please read specification
   * in subjectsettings.xsd
   *
   * @param security
   *          to check against
   * @param forOperationName
   *          for operation name
   * @throws NoPermissionException
   */
  public static void checkSecurity(Security security, String forOperationName) throws SecurityException {
    if(security == null){
      throw new SecurityException("Security configuration missing, attempted to check operation name " + forOperationName);
    }

    Subject subject = SecurityUtils.getSubject();

    if(subject == null || !subject.isAuthenticated()){
      throw new SecurityException("Attempted to check operation name " + forOperationName + ", but the user is not authenticated!");
    }

    Operation op = findOperation(security, forOperationName);
    // no operation means exception
    if(op == null){
      throw new SecurityException("Configuration for Operation " + forOperationName + " is missing");
    }

    // blank permission means: pass, otherwise check each separated by ' '
    if(!op.getPermission().isEmpty()){

      // for performace' sake used detailed infos in debug mode only

      if(Configuration.isDebug()){
        String perms[] = op.getPermission().split(" ");
        boolean result[] = subject.isPermitted(perms);
        StringBuilder sb = new StringBuilder();
        for(int i=0;i<result.length;i++){
          if(!result[i]){
            sb.append(perms[i]);
            sb.append(" ");
          }
        }
        // ok got some permission user does not have
        if(sb.length()>0){
          // format
          sb.setLength(sb.length()-1);
          // throw exception
          throw new NoPermissionException(security, forOperationName, sb.toString());
        }
      }else{
        if(!subject.isPermittedAll(op.getPermission().split(" "))){
          throw new NoPermissionException(security, forOperationName, "[available in Debug mode enabled]");
        }
      }
    }
  }

  /**
   *
   * @param security
   * @param operationName
   * @return TRUE if operation definition for operationName is found in security
   */
  public static boolean hasOperation(Security security, String operationName){
    return findOperation(security, operationName)!=null;
  }

  /**
   *
   * @param security
   * @param operationName
   * @return Operation object for given operationName from Security or NULL if none found
   */
  public static Operation findOperation(Security security, String operationName){
    for(Operation op : security.getOperation()){
      if(operationName.equals(op.getName())){
        return op;
      }
    }
    return null;
  }

  /**
   * retrieve list of permissions for given type on the subject. This method heavily utilizes internals of Shiro framework via reflection as Shiro do not
   * provide such an interface to retrieve collection of permissions.
   *
   * @param subject
   *          the subject must be authenticated
   * @param permissionType
   *          to retrieve permissions for
   * @return empty/non-empty set of permissions
   *
   * @throws SecurityException
   *           in case the subject is not authenticated
   */
  public static Set<String> getPermissions(Subject subject, String permissionType) {
    if (!subject.isAuthenticated()) {
      throw new SecurityException("subject is not authenticated");
    }
    final PrincipalCollection principals = subject.getPrincipals();
    DefaultSecurityManager dsm = (DefaultSecurityManager) SecurityUtils.getSecurityManager();

    Set<String> permissions = new HashSet<>();

    final Method queryMethod;
    try {
      queryMethod = AuthorizingRealm.class.getDeclaredMethod("getAuthorizationInfo", PrincipalCollection.class);
      queryMethod.setAccessible(true);
      dsm.getRealms().stream().filter(r -> r instanceof AuthorizingRealm).forEach(r -> {
        final Object queryResult;
        try {
          queryResult = queryMethod.invoke(r, principals);
        } catch (InvocationTargetException ite) {
          throw new RuntimeException("invocation of '" + queryMethod.getName() + "' on Realm of type " + r.getClass().getName() + "failed", ite.getTargetException());
        } catch (Exception e) {
          throw new RuntimeException("failed to invoke method '" + queryMethod.getName() + "' on Realm of type " + r.getClass().getName(), e);
        }
        // no AuthorizationInfo returned
        if(queryResult == null){
          return;
        }
        if (queryResult instanceof AuthorizationInfo) {
          AuthorizationInfo ai = (AuthorizationInfo) queryResult;
          // geo:country:de, geo:country:*, foo:bar
          Collection<String> stringPerms = ai.getStringPermissions();
          // empty perms-set
          if(stringPerms == null){
            return;
          }
          stringPerms.stream().filter(p -> p.startsWith(permissionType + ":")).forEach(p -> {
            // remove permissiontype followed by colon
            permissions.add(p.substring(permissionType.length() + 1));
          });
        } else {
          throw new RuntimeException("query-result is not of compatible type: " + queryResult.getClass().getName());
        }
      });
    } catch (Exception e) {
      throw new RuntimeException("failed to retrieve pemissions", e);
    }
    return permissions;
  }
}