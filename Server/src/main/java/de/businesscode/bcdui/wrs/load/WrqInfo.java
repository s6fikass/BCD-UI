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
package de.businesscode.bcdui.wrs.load;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import de.businesscode.bcdui.binding.BindingItem;
import de.businesscode.bcdui.binding.BindingSet;
import de.businesscode.bcdui.binding.Bindings;
import de.businesscode.bcdui.binding.exc.BindingException;
import de.businesscode.bcdui.binding.exc.BindingNotFoundException;
import de.businesscode.bcdui.wrs.load.modifier.Modifier;
import de.businesscode.util.StandardNamespaceContext;
import de.businesscode.util.XPathUtils;

/**
 * Collects knowledge about the Wrq.
 * Initially taken from WrsSqlGenerator. For older change history see there
 */
public class WrqInfo
{
  private final Element wrq;
  private final Bindings bindings;
  private int columnNumber = 1;
  private BindingSet resultingBindingSet;
  private String wrqBindingSetId; // As send in the request. May be different from the actual BindingSet in case of BindingGroup
  // Maps all wrs:C/@bRef-@aggr and wrs:A @bRef-@aggr combinations to a BindingSetwithMetadata
  // This includes the select list of the ResultSet and all other places
  private Map<String,WrqBindingItem> allBRefAggrs;
  // Maps all wrs:C/@bRef and wrs:A @bRef combinations to a BindingSetwithMetadata (ignoring the @aggr)
  // This includes the select list of the ResultSet and all other places
  private Map<String,WrqBindingItem> allBRefs;
  // Lists all wrs:C/@bRef and wrs:A/@bRef
  // This is to determine the tables (BindingSets) needed for the statement
  private Set<String> allRawBRefs;
  // All wrs:C/@bRef-@aggr and wrs:A/@bRef-@aggr combinations of the select list to a BindingSetWithMetadata
  // These are only those needed as the result of the ResultSet, the user selected once plus Grouping and Other
  private LinkedHashSet<String> fullSelectListBRefs;
  // All wrs:C/@bRef-@aggr and wrs:A/@bRef-@aggr combinations of the select list to a BindingSetWithMetadata
  // Does only include those asked for by the user explicitly
  private LinkedHashSet<String> userSelectListBRefs;
  // Each selected wrs:C element. this is also the only place where identical @bRef/@aggr combinations are listed twice
  // Each entry knows its wrs:C attributes but they are not listed here
  private LinkedList<WrqBindingItem> wrsCOnlySelectListBRefs;
  // Contains all bRefs which are part of the requested group-by
  private Set<String> groupingBRefs;
  private Set<String> havingBRefs;
  private LinkedHashSet<String> orderingBRefs = new LinkedHashSet<String>();
  // We may replace the given f:Filter by one modified at the server. Since we do not want to change the original WrsRequest, 
  // because it is returned to the client and we do not want that to be included there, we hold such an element here.
  private Element resultingFilterParent;
  // Keeps track of the virtual dimension members. Maps a bRef to a map of new names (i.e. content) of the data to the values mapped to this new name
  private Map<String,Map<String,Set<String>>> vdms = new HashMap<>();
  // This indicates whether this request uses a Grouping Function, for example grouping sets
  private boolean reqHasGroupingFunction = false;
  private boolean reqHasGroupBy = false;
  private boolean isSelectDistinct = false;

  int aliasCounter     = 1;
  int virtualBiCounter = 1;


  /**
   *
   * @param wrq
   * @param bindings A parameter and not Bindings.getInstance() because we may be called in batch mode
   * @throws Exception
   */
  public WrqInfo( Document wrq, Bindings bindings ) throws Exception
  {
    try {
      xp = XPathUtils.newXPathFactory().newXPath();
      StandardNamespaceContext nsContext = StandardNamespaceContext.getInstance();
      xp.setNamespaceContext(nsContext);
      selectXpathExpr =           xp.compile("/wrq:WrsRequest/wrq:Select");
      fromBindingSetXpathExpr =   xp.compile("/wrq:WrsRequest/wrq:Select/wrq:From/wrq:BindingSet");
      filterXpathExpr =           xp.compile("/wrq:WrsRequest/wrq:Select/f:Filter");
      groupByRootXpathExpr =      xp.compile("/wrq:WrsRequest/wrq:Select/wrq:Grouping");     // grouping columns or functions
      groupByChildrenXpathExpr =  xp.compile("/wrq:WrsRequest/wrq:Select/wrq:Grouping/wrq:*");     // grouping columns or functions
      groupByIndicatorXpathExpr=  xp.compile("/wrq:WrsRequest/wrq:Select/wrq:Grouping//wrq:Set | /wrq:WrsRequest/wrq:Select/wrq:Grouping//wrq:C");     // indicates grouping query
      groupByFunctionXpathExpr =  xp.compile("/wrq:WrsRequest/wrq:Select/wrq:Grouping/wrq:*[not(self::wrq:C)]");  // grouping functions
      havingRootXpathExpr      =  xp.compile("/wrq:WrsRequest/wrq:Select/wrq:Having");  // having clause
      topNXPathExpr =             xp.compile("/wrq:WrsRequest/wrq:Select/wrq:TopNDimMembers");

      selectListCAXpathExpr =     xp.compile("/*/wrq:Select/wrq:Columns//*[self::wrq:C | self::wrq:A]");
      groupingCXpathExpr    =     xp.compile("/*/wrq:Select/wrq:Grouping//wrq:C");
      orderingCXpathExpr    =     xp.compile("/*/wrq:Select/wrq:Ordering/wrq:C");

      selectListBidRefXpathExpr   = xp.compile("/*/wrq:Select/wrq:Columns//*[not(wrq:Calc)]/@bRef       | /*/wrq:Select//*[local-name()='ValueRef' and not(wrq:Calc)]/@idRef");
      filterBidRefXpathExpr       = xp.compile("/*/wrq:Select/f:Filter//f:Expression/@bRef");
      groupingBidRefXpathExpr     = xp.compile("/*/wrq:Select/wrq:Grouping//wrq:C[not(wrq:Calc)]/@bRef | /*/wrq:Select/wrq:Grouping//*[local-name()='ValueRef' and not(wrq:Calc)]/@idRef");
      havingBidRefXpathExpr       = xp.compile("/*/wrq:Select/wrq:Having//f:Expression//@bRef");
      orderingBidRefXpathExpr     = xp.compile("/*/wrq:Select/wrq:Ordering/wrq:C[not(wrq:Calc)]/@bRef  | /*/wrq:Select/wrq:Ordering/*[local-name()='ValueRef' and not(wrq:Calc)]/@idRef");
      topNBidRefXPathExpr         = xp.compile("/*/wrq:Select/wrq:TopNDimMembers//wrq:LevelRef/@bRef   | /*/wrq:Select/wrq:TopNDimMembers//*[local-name()='ValueRef' and not(wrq:Calc)]/@idRef");

      vdmXpathExpr                 = xp.compile("/*/wrq:Select/wrq:Vdms/wrq:Vdm[@bRef]/wrq:VdmMap[@to]");
    } catch (XPathExpressionException e) {
      throw new RuntimeException("Cannot initialize class. Wrong XPath", e); // it's a bug
    }
    this.bindings = bindings;

    // The caller can indicate an empty request by sending no request doc or an empty <wrq:WrsRequest/> root element
    // because it is very often much easier to use than preventing an empty request
    // (WrsDataWriter will for example return <wrs:Wrs>Empty</wrs:Wrs>)
    if( wrq!=null && wrq.getDocumentElement()!=null
        && wrq.getDocumentElement().getElementsByTagNameNS(StandardNamespaceContext.WRSREQUEST_NAMESPACE,"BindingSet").getLength()==1 ) {
      this.wrq = wrq.getDocumentElement();
      try {
        if( !StandardNamespaceContext.WRSREQUEST_NAMESPACE.equals(this.wrq.getNamespaceURI()) )
          throw new RuntimeException("Parse error, not a valid WrsRequest."); // can be namespace, can be anything
      } catch(Exception e) {
        throw new Exception("Error evaluating a WrsRequest.",e);
      }
      initMetaData();
    } else
      this.wrq = null;
  }

  /**
   * This is the binding set / group named in the Wrq
   * @see de.businesscode.bcdui.wrs.load.ISqlGenerator#getRequestedBindingSetName()
   */
  protected String getRequestedBindingSetName() {
    return wrqBindingSetId;
  }

  /**
   * @see de.businesscode.bcdui.wrs.load.ISqlGenerator#getStartRow()
   */
  protected int getStartRow() {
    try {
      String attribute = wrq.getAttribute("startRow");
      if( attribute.isEmpty() )
        return 1;
      else
        return Integer.parseInt(attribute);
    }
    catch (Exception e) {
    }
    return 1; // default
  }

  protected boolean isEmpty()
  {
    return wrq == null;
  }

  protected LinkedHashSet<String> getOrderingBRefs() {
    return orderingBRefs;
  }

  protected LinkedHashSet<String> getFullSelectListBRefs() {
    return fullSelectListBRefs;
  }
  protected LinkedHashSet<String> getUserSelectListBRefs() {
    return userSelectListBRefs;
  }

  protected LinkedList<WrsBindingItem> getWrsCOnlySelectListBRefs() {
    LinkedList<WrsBindingItem> ret = new LinkedList<WrsBindingItem>();
    for(Iterator<WrqBindingItem> it = wrsCOnlySelectListBRefs.iterator(); it.hasNext(); )
      ret.add(it.next());
    return ret;
  }

  protected Element getFilterNode() throws XPathExpressionException {
    return (Element) filterXpathExpr.evaluate(resultingFilterParent, XPathConstants.NODE);
  }
  protected Element getGroupingNode() throws XPathExpressionException {
    return (Element) groupByRootXpathExpr.evaluate(wrq, XPathConstants.NODE);
  }
  protected Element getHavingNode() throws XPathExpressionException {
    return (Element) havingRootXpathExpr.evaluate(wrq, XPathConstants.NODE);
  }

  /**
   * Initializes internal data structures for this Wrq
   * - The resulting BindingSet
   * - All bRefs used and their WrqBindingItem
   * - bRefs used in the select list
   * - bRefs used in group by
   * @throws Exception
   * @throws ParserConfigurationException
   * @throws IOException
   * @throws SAXException
   */
  protected void initMetaData() throws Exception
  {
    this.isSelectDistinct = Boolean.parseBoolean( ((Element)selectXpathExpr.evaluate(wrq, XPathConstants.NODE)).getAttribute("isDistinct") );
    wrqBindingSetId = (String) fromBindingSetXpathExpr.evaluate(wrq, XPathConstants.STRING);

    allBRefAggrs = new HashMap<String, WrqBindingItem>();
    allBRefs = new HashMap<String, WrqBindingItem>();
    allRawBRefs = new HashSet<String>();
    fullSelectListBRefs = new LinkedHashSet<String>();
    userSelectListBRefs = new LinkedHashSet<String>();
    wrsCOnlySelectListBRefs = new LinkedList<WrqBindingItem>();
    groupingBRefs = new HashSet<String>();
    havingBRefs = new HashSet<String>();

    // Let's check, whether we have a filter modifiers attached to the BindingSet (/Group) and apply them
    // Note, we have a chicken and egg problem here. To ask a BindingSet for its modifiers, 
    // we first have to know the requested BindingItems to get the right BindingSet in case the id references to a BindingSetGroup
    // But the modifier can change the set of required BindingItems. We handle this as follows:
    // If there is a BindingSetGroup registered for the name, we take its modifiers, otherwise we get the direct BindingSet ones
    resultingFilterParent = wrq;
    for( Class<? extends Modifier> modifier: bindings.getWrqModifiers(wrqBindingSetId) ) {
      // Calculate filterServer so thaxt we have the correct bRef set
      resultingFilterParent = modifier.newInstance().process((Element) filterXpathExpr.evaluate(wrq, XPathConstants.NODE));
    }

    // Read the vdm virtual dimension members, they will be applied by WrqBindingItem further down
    // We know from the xPath, that ../*/@bRef, @to and @from are not empty.
    // We indicate the 'rest' value via a from=null assigned to to
    NodeList vdmMapNodeList  = (NodeList) vdmXpathExpr.evaluate(wrq, XPathConstants.NODESET);
    String vdmBRef = null;
    Map<String,Set<String>> mapping = null;
    for( int vm=0; vm<vdmMapNodeList.getLength(); vm++ ) {
      Element vdmMapElem = (Element)vdmMapNodeList.item(vm);

      // Let's see, whether we deal with a different bRef than before
      String tmp = ((Element)vdmMapElem.getParentNode()).getAttribute("bRef");
      if( !tmp.equals(vdmBRef) ) {
        vdmBRef = tmp;
        mapping = vdms.get( vdmBRef ) != null ? vdms.get( vdmBRef ) : new HashMap<String,Set<String>>();
        // Take care for the 'rest' mapping
        String rest = ((Element)vdmMapElem.getParentNode()).getAttribute("rest");
        if( ! rest.isEmpty() )
          mapping.put(rest, null);
      }

      // Split @from into individual values
      String fromParam = vdmMapElem.getAttribute("from");
      String toParam = vdmMapElem.getAttribute("to");
      Set<String> from = new HashSet<>();
      Stream.of(fromParam.split("\uE0F2")).forEach(from::add);
      mapping.put(toParam, from);

      vdms.put( vdmBRef, mapping );
    }

    NodeList selectedBidRefNl  = (NodeList) selectListBidRefXpathExpr.evaluate(wrq, XPathConstants.NODESET);
    NodeList filterBidRefNl    = (NodeList) filterBidRefXpathExpr.evaluate(resultingFilterParent, XPathConstants.NODESET);
    NodeList groupingBidRefNl  = (NodeList) groupingBidRefXpathExpr.evaluate(wrq, XPathConstants.NODESET);
    NodeList havingBidRefNl    = (NodeList) havingBidRefXpathExpr.evaluate(wrq, XPathConstants.NODESET);
    NodeList orderingBidRefNl  = (NodeList) orderingBidRefXpathExpr.evaluate(wrq, XPathConstants.NODESET);
    NodeList selectedNl  = (NodeList) selectListCAXpathExpr.evaluate(wrq, XPathConstants.NODESET);

    // A) No bindingItem addressed, just select all items of the BindingSet
    if( selectedBidRefNl.getLength()==0 && filterBidRefNl.getLength()==0 && groupingBidRefNl.getLength()==0 
        && havingBidRefNl.getLength() == 0 && orderingBidRefNl.getLength()==0 && selectedNl.getLength() == 0)
    {
      resultingBindingSet = bindings.get(wrqBindingSetId); // We just use the explicitly given BindingSet (must not be a BindingGroup obviously)
      selectAllBindingItems();
    }

    // B) Some bRef/idRef given
    else
    {
      NodeList groupingNl  = (NodeList) groupingCXpathExpr.evaluate(wrq, XPathConstants.NODESET);
      NodeList orderingNl  = (NodeList) orderingCXpathExpr.evaluate(wrq, XPathConstants.NODESET);
      NodeList topNBidRefNl = (NodeList) topNBidRefXPathExpr.evaluate(wrq, XPathConstants.NODESET);

      for( int i=0; i<selectedBidRefNl.getLength(); i++ )
        allRawBRefs.add(selectedBidRefNl.item(i).getNodeValue());
      for( int i=0; i<filterBidRefNl.getLength(); i++ )
        allRawBRefs.add(filterBidRefNl.item(i).getNodeValue());
      for( int i=0; i<groupingBidRefNl.getLength(); i++ ) {
        allRawBRefs.add(groupingBidRefNl.item(i).getNodeValue());
        groupingBRefs.add(groupingBidRefNl.item(i).getNodeValue());
      }
      for( int i=0; i<havingBidRefNl.getLength(); i++ ) {
        allRawBRefs.add(havingBidRefNl.item(i).getNodeValue());
        havingBRefs.add(havingBidRefNl.item(i).getNodeValue());
      }
      for( int i=0; i<orderingBidRefNl.getLength(); i++ )
        allRawBRefs.add(orderingBidRefNl.item(i).getNodeValue());
      for ( int i=0; i<topNBidRefNl.getLength();i++) {
        allRawBRefs.add(topNBidRefNl.item(i).getNodeValue());
      }
      resultingBindingSet = bindings.get(wrqBindingSetId, allRawBRefs);

      // B.1.a Empty select list
      if( selectedBidRefNl.getLength()==0 && selectedNl.getLength() == 0 ) {
        selectAllBindingItems();
      }

      // B.1.b Select list given
      else
      {
        reqHasGroupBy = ((NodeList)groupByIndicatorXpathExpr.evaluate(wrq, XPathConstants.NODESET)).getLength() > 0;
        reqHasGroupingFunction = ((NodeList)groupByFunctionXpathExpr.evaluate(wrq, XPathConstants.NODESET)).getLength() > 0;
        WrqBindingItem lastWrqC = null;
        for( int i=0; i<selectedNl.getLength(); i++ )
        {
          Element cAElem = (Element)selectedNl.item(i);

          WrqBindingItem wrqBi = new WrqBindingItem(this, cAElem, "v"+(aliasCounter++), false, lastWrqC);

          String bRef_Aggr = wrqBi.getId()+(wrqBi.getAggr()==null ? "":" "+wrqBi.getAggr());

          // wrs:C go to selectList
          if( "C".equals(cAElem.getLocalName()) ) {
            lastWrqC = wrqBi;
            WrqBindingItem prevBiwmd = allBRefAggrs.get(bRef_Aggr);
            wrsCOnlySelectListBRefs.add(prevBiwmd!=null? prevBiwmd : wrqBi);
          }
          if( allBRefAggrs.get(bRef_Aggr)==null ) { // If it was already there, keep it as wrsCOnlySelectListBRefs is referencing it already
            allBRefAggrs.put(bRef_Aggr, wrqBi);
            allBRefs.put(wrqBi.getId(), wrqBi);
          }
          fullSelectListBRefs.add(bRef_Aggr);
          userSelectListBRefs.add(bRef_Aggr);

        }

        // Now let's see whether the column takes part in a grouping function (not just a plain group),
        // then lets create a @bcdGr = grouping(c) attribute for it to see whether it's value (if null) belongs to an aggregate
        for(Iterator<WrqBindingItem> it=wrsCOnlySelectListBRefs.iterator(); it.hasNext(); )
        {
          // TODO only for those taking part in grouping fct
          WrqBindingItem biWm = it.next();
          String bRef = biWm.getId();
          if( reqHasGroupingFunction && groupingBRefs.contains(bRef) ) {
            WrqBindingItem grBi = new WrqBindingItem(this, ISqlGenerator.BCD_WKATTRIBUTE_GROUPING, "GROUPING","isG"+biWm.getAlias(), biWm, null);
            fullSelectListBRefs.add(bRef+" GROUPING");
            allBRefAggrs.put(bRef+" GROUPING", grBi);
          }
        }
      }

      // B.2 Take care for BindingItems used in filtering
      for( int i=0; i<filterBidRefNl.getLength(); i++ )
      {
        Node fBiDRef = filterBidRefNl.item(i);
        String bRef = fBiDRef.getNodeValue();
        if( !allBRefs.containsKey(bRef)) {// Do not overwrite, needs to be consistent with entries from before
          BindingItem bi = resultingBindingSet.get(bRef);
          WrqBindingItem wrqBi = new WrqBindingItem(this, bi, "v"+(aliasCounter++), false);
          allBRefs.put(bRef, wrqBi);
        }
      }

      // B.3 Take care for BindingItems used in grouping
      for( int i=0; i<groupingNl.getLength(); i++ )
      {
        Element grElem = (Element)groupingNl.item(i);
        WrqBindingItem wrqBi = new WrqBindingItem(this, grElem, "v"+(aliasCounter++), false);
        if( !allBRefs.containsKey(wrqBi.getId())) {// Do not overwrite, needs to be consistent with entries from before
          allBRefs.put(wrqBi.getId(), wrqBi);
        }
      }

      // B.4 Take care for BindingItems used in having
      for( int i=0; i<havingBidRefNl.getLength(); i++ )
      {
        Node hBiDRef = havingBidRefNl.item(i);
        String bRef = hBiDRef.getNodeValue();
        if( !allBRefs.containsKey(bRef)) {// Do not overwrite, needs to be consistent with entries from before
          BindingItem bi = resultingBindingSet.get(bRef);
          WrqBindingItem wrqBi = new WrqBindingItem(this, bi, "v"+(aliasCounter++), false);
          allBRefs.put(bRef, wrqBi);
        }
      }

      // B.5 Take care for BindingItems used in ordering
      for( int i=0; i<orderingNl.getLength(); i++ )
      {
        Element orElem = (Element)orderingNl.item(i);
        boolean isDescending = ( "desc".equals(orElem.getAttribute("order")) );
        WrqBindingItem biWm = new WrqBindingItem(this, orElem, "v"+(aliasCounter++), false);
        String bRef_Aggr = biWm.getId()+(biWm.getAggr()==null ? "":" "+biWm.getAggr());
        orderingBRefs.add(bRef_Aggr);
        if( !allBRefAggrs.containsKey(bRef_Aggr)) {// Do not overwrite, needs to be consistent with entries from before
          biWm.setOrderByDescending(isDescending);
          allBRefs.put(biWm.getId(), biWm);
          allBRefAggrs.put(bRef_Aggr,biWm);
        }
        else
          allBRefAggrs.get(bRef_Aggr).setOrderByDescending(isDescending);
      }

    }
    // Now we need to assure the correct columnNumber for our users, i.e. it defines the position in the outer most select list
    // i.e. the position in the ResultSet
    for( String sl : fullSelectListBRefs ) {
      allBRefAggrs.get(sl).setColumnNumber(columnNumber++);
    }
  }

  /**
   * No binding items are explicitly given in select clause, collect here all the BindingSet has to offer
   * @throws BindingException
   */
  protected void selectAllBindingItems() throws BindingException
  {
    if( !resultingBindingSet.isAllowSelectAllColumns() )
      throw new BindingException("The BindingSet " + wrqBindingSetId +" requires list of bindings items in Select clause, see bnd:BindingSet/@allowSelectAllColumns");

    Iterator<BindingItem> bitemsIt = resultingBindingSet.getBindingItems().iterator();
    while( bitemsIt.hasNext() ) {
      BindingItem bi = bitemsIt.next();
      String bRef = bi.getId();
      WrqBindingItem biWm = new WrqBindingItem(this, bi, "v"+(aliasCounter++), !groupingBRefs.isEmpty() && !groupingBRefs.contains(bRef));
      allBRefAggrs.put(biWm.getId(), biWm);
      allBRefs.put(biWm.getId(), biWm);
      fullSelectListBRefs.add(biWm.getId());
      userSelectListBRefs.add(biWm.getId());
      wrsCOnlySelectListBRefs.add(biWm);
    }
  }

  /**
   * Usually, the aggregation is defined in the Wrq Element e for the column.
   * There are two cases where not: It is not given (select all, no explicit select list), or the attribute is simply not set.
   * Then we have this mechanism for default-aggregator, the returned aggregator can be trusted (i.e. no SQL injection can happen within this fkt)
   * 1) Wrq/Columns/C/@aggr
   * 2) BindingSet/BindingItem/@aggr
   * 3) MAX() or SUM() depending on the BindingItems data type
   * @param bi
   * @return
   */
  protected String getDefaultAggr( BindingItem bi )
  {
    String aggr = aggregationMapping.get(bi.getAggr());
    if( aggr==null )
      return WrqBindingItem.getDefaultAggr(bi.getJDBCDataType());
    return aggr;
  }

  public Document getOwnerDocument() {
    return wrq.getOwnerDocument();
  }

  public NodeList getSelectNodes() {
    return wrq.getElementsByTagNameNS(StandardNamespaceContext.WRSREQUEST_NAMESPACE,"Select");
  }

  public String getBindingSetId() throws XPathExpressionException
  {
    return (String) fromBindingSetXpathExpr.evaluate(wrq, XPathConstants.STRING);
  }

  public Map<String, WrqBindingItem> getAllBRefAggrs() {
    return allBRefAggrs;
  }
  public Map<String, WrqBindingItem> getAllBRefs() {
    return allBRefs;
  }

  public Set<String> getAllRawBRefs() {
    return allRawBRefs;
  }

  public BindingItem getNoMetaDataBindingItem(String id) throws BindingNotFoundException
  {
    return resultingBindingSet.get(id);
  }

  public NodeList getGroupingChildNode() throws XPathExpressionException {
    return (NodeList)groupByChildrenXpathExpr.evaluate(wrq, XPathConstants.NODESET);
  }

  public NodeList getTopNs() throws XPathExpressionException {
    return (NodeList) topNXPathExpr.evaluate(wrq, XPathConstants.NODE);
  }
  public int getNextColumnNumber() {
    return columnNumber++;
  }
  public BindingSet getResultingBindingSet()
  {
    return resultingBindingSet;
  }
  public Set<String> getGroupingBRefs()
  {
    return groupingBRefs;
  }
  public Set<String> getHavingBRefs()
  {
    return havingBRefs;
  }
  public boolean reqHasGroupingFunction() {
    return reqHasGroupingFunction;
  }
  public boolean reqHasGroupBy() {
    return reqHasGroupBy;
  }
  public boolean isSelectDistinct() {
    return isSelectDistinct;
  }

  /**
   * Return the virtual dimension members for a bRef
   * @param bRef
   * @return
   */
  public Map<String,Set<String>> getVdm( String bRef ) {
    return vdms.get( bRef );
  }

  private static final Map<String, String> aggregationMapping;
  private final XPath xp;
  private final XPathExpression selectXpathExpr;
  private final XPathExpression fromBindingSetXpathExpr;
  private final XPathExpression filterXpathExpr;
  private final XPathExpression groupByRootXpathExpr;
  private final XPathExpression groupByChildrenXpathExpr;
  private final XPathExpression groupByIndicatorXpathExpr;
  private final XPathExpression groupByFunctionXpathExpr;
  private final XPathExpression havingRootXpathExpr;
  private final XPathExpression topNXPathExpr;

  private final XPathExpression selectListCAXpathExpr;
  private final XPathExpression groupingCXpathExpr;
  private final XPathExpression orderingCXpathExpr;

  private final XPathExpression selectListBidRefXpathExpr;
  private final XPathExpression filterBidRefXpathExpr;
  private final XPathExpression groupingBidRefXpathExpr;
  private final XPathExpression havingBidRefXpathExpr;
  private final XPathExpression orderingBidRefXpathExpr;
  private final XPathExpression topNBidRefXPathExpr;

  private final XPathExpression vdmXpathExpr;

  static {
    aggregationMapping = new HashMap<String, String>();
    aggregationMapping.put("sum", "SUM");
    aggregationMapping.put("max", "MAX");
    aggregationMapping.put("min", "MIN");
    aggregationMapping.put("avg", "AVG");
    aggregationMapping.put("count", "COUNT");
    aggregationMapping.put("grouping", "GROUPING");
    aggregationMapping.put("none", ""); // Can be used if the column expression already has a aggregator defined
  }
}