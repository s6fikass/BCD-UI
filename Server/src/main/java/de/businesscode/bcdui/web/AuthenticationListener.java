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
package de.businesscode.bcdui.web;

import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.DisabledAccountException;
import org.apache.shiro.authc.ExcessiveAttemptsException;
import org.apache.shiro.authc.IncorrectCredentialsException;
import org.apache.shiro.authc.UnknownAccountException;
import org.apache.shiro.subject.PrincipalCollection;

import de.businesscode.bcdui.logging.LoginSqlLogger.LOGIN_RESULTS;

public class AuthenticationListener implements org.apache.shiro.authc.AuthenticationListener{

  @Override
  public void onFailure(AuthenticationToken arg0, AuthenticationException arg1) {
    String userName = arg0.getPrincipal().toString();
    LOGIN_RESULTS result = LOGIN_RESULTS.FAILED;
    if (arg1 instanceof UnknownAccountException)
      result = LOGIN_RESULTS.ACC_UNKNOWN;
    else if (arg1 instanceof IncorrectCredentialsException)
      result = LOGIN_RESULTS.CREDS_WRONG;
    else if (arg1 instanceof DisabledAccountException)
      result = LOGIN_RESULTS.ACC_DISABLED;
    else if (arg1 instanceof ExcessiveAttemptsException)
      result = LOGIN_RESULTS.EXCESSIVE_ATTEMPTS;
    else if (arg1 instanceof AuthenticationException)
      result = LOGIN_RESULTS.FAILED;
    SecurityUtils.getSubject().getSession(true).setAttribute("BCD_LOGIN_USER", userName);
    SecurityUtils.getSubject().getSession(true).setAttribute("BCD_LOGIN_RESULT", result);
  }

  @Override
  public void onLogout(PrincipalCollection arg0) {
    // TODO Auto-generated method stub
    
  }

  @Override
  public void onSuccess(AuthenticationToken arg0, AuthenticationInfo arg1) {
    String userName = arg0.getPrincipal().toString();
    LOGIN_RESULTS result = LOGIN_RESULTS.OK;
    SecurityUtils.getSubject().getSession(true).setAttribute("BCD_LOGIN_USER", userName);
    SecurityUtils.getSubject().getSession(true).setAttribute("BCD_LOGIN_RESULT", result);
  }
}