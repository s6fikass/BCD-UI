<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!--
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
-->
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml" version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:xapi="http://www.businesscode.de/schema/bcdui/xmlapi-1.0.0">

<xsl:output encoding="UTF-8" indent="no" method="html" version="1.0"/>
<xsl:param name="bcdContextPath"/>
<xsl:param name="bcdInputModelId"/>

<xsl:template match="xapi:InlineModel" name="inlineModel">
  <xsl:param name="id" select="@id"/>
  <xsl:param name="data" select="@data"/>

  <xsl:variable name="absXpath">
    <xsl:for-each select="ancestor-or-self::*">
      <xsl:value-of select="concat('/*[',count(preceding-sibling::*)+1,']')"/>
    </xsl:for-each>
  </xsl:variable>

  <xsl:variable name="onLoad">
    var id = ('<xsl:value-of select="$id"/>' == '') ? bcdui.factory.objectRegistry.generateTemporaryIdInScope("bcdCId_inlineModel_") : '<xsl:value-of select="$id"/>';
    bcdui.core.bcdParamBag[bcdui.core.bcdParamBag.length-1].parentDataProvider = id;
    <!--
      TODO: issue #BUI-754
        - inline content will not work if model was generated by XSLT itself and was not
          attached as inputDocument on the transformation. Proposal: serialize body of
          InlineModel as inlineData rather than fetching from $bcdInputModelId;
          *when implemented remove the throw below*
     -->
    var inlineData = bcdui.factory.objectRegistry.getObject('<xsl:value-of select="$bcdInputModelId"/>').getData();
    var inlineNode = inlineData.selectSingleNode('<xsl:value-of select="$absXpath"/>/*');
    <xsl:if test="not($data)">if(!inlineNode) throw "xapi:InlineModel incompatibility: Please, provide content either in xapi:InlineModel/@data or provide xapi document as inputDocument on transformation, InlineModel id=" + id;</xsl:if>
    inlineData = ("<xsl:value-of select="$data"/>" == "") ? new XMLSerializer().serializeToString(inlineNode) : "<xsl:value-of select="$data"/>";
    (function(){<xsl:apply-templates select="xapi:*"/>}());
    bcdui.factory.createStaticModel({ id: id, data: inlineData });
    bcdui.core.bcdParamBag[bcdui.core.bcdParamBag.length-1].dataProviders = id;
  </xsl:variable>

  <xsl:choose>
    <xsl:when test="../self::xapi:*">
      <xsl:value-of select="$onLoad"/>
    </xsl:when>
    <xsl:otherwise>
      <span bcdComment="inlineModel">
        <xsl:attribute name="bcdOnLoad">
          <xsl:value-of select="$onLoad"/>
        </xsl:attribute>
        <xsl:value-of select="*[false()]"/>
      </span>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template name="extractJsParameters">
  <xsl:param name="parameterString" select="''"/>
  var parametersString = "<xsl:value-of select="$parameterString"/>";
  if( parametersString == "") {
    var params = bcdui.core.bcdParamBag[bcdui.core.bcdParamBag.length-1].parameters;
    if ( params ) {
      for( p in params ) {
        parametersString += parametersString!="" ? ", " : "";
        parametersString += p+": "+params[p]+"";
      }
    }
    parametersString = "{ "+parametersString+" }";
  }
  var parameters = eval('('+parametersString+')');
</xsl:template>

<xsl:template match="xapi:Param" name="param">
  bcdui.core.bcdParamBag[bcdui.core.bcdParamBag.length-1].parameters = bcdui.core.bcdParamBag[bcdui.core.bcdParamBag.length-1].parameters || new Object();
  <xsl:choose>
    <xsl:when test="@value">bcdui.core.bcdParamBag[bcdui.core.bcdParamBag.length-1].parameters.<xsl:value-of select="@name"/> = '"<xsl:value-of select="@value"/>"';</xsl:when>
    <xsl:otherwise>
      bcdui.core.bcdParamBag.push(new Object());
      <xsl:apply-templates select="xapi:*"/>
      bcdParamBagChild = bcdui.core.bcdParamBag.pop();
      bcdui.core.bcdParamBag[bcdui.core.bcdParamBag.length-1].parameters.<xsl:value-of select="@name"/> = "{ refId: '"+bcdParamBagChild.dataProviders+"'}";
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template match="xapi:Ref" name="ref">
  bcdui.core.bcdParamBag[bcdui.core.bcdParamBag.length-1].dataProviders = '<xsl:value-of select="@idRef"/>';
</xsl:template>

<xsl:template match="xapi:OnCoreReady" name="onCoreReady">
  <xsl:param name="fn" select="@fn" />
  <xsl:variable name="onLoad">bcdui.core.ready(function(){ <xsl:value-of select="$fn" /> });</xsl:variable>
  <xsl:choose>
    <xsl:when test="../self::xapi:*">
      <xsl:value-of select="$onLoad" />
    </xsl:when>
    <xsl:otherwise>
      <span bcdComment="onCoreReady">
        <xsl:attribute name="bcdOnLoad">
          <xsl:value-of select="$onLoad"/>
        </xsl:attribute>
        <xsl:value-of select="*[false()]"/>
      </span>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template match="xapi:Save" name="save">
  <xsl:param name="idRef" select="@idRef" />
  <xsl:variable name="onLoad">
    bcdui.factory.objectRegistry.withObjects({ids: [ "<xsl:value-of select="$idRef"/>" ], fn: function() { bcdui.factory.objectRegistry.getObject("<xsl:value-of select="$idRef"/>").sendData() } });
  </xsl:variable>
  <xsl:choose>
    <xsl:when test="../self::xapi:*">
      <xsl:value-of select="$onLoad" />
    </xsl:when>
    <xsl:otherwise>
      <span bcdComment="onCoreReady">
        <xsl:attribute name="bcdOnLoad">
          <xsl:value-of select="$onLoad"/>
        </xsl:attribute>
        <xsl:value-of select="*[false()]"/>
      </span>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template match="xapi:execute" name="execute">
  <xsl:param name="idRef" select="@idRef" />
  <xsl:param name="shouldRefresh" select="@shouldRefresh" />
  <xsl:variable name="onLoad">
    var objectIds = new Array();
    if ('<xsl:value-of select="$idRef"/>' == '')
      objectIds.push(bcdui.core.bcdParamBag[bcdui.core.bcdParamBag.length-1].parentDataProvider);
    else
      objectIds = '<xsl:value-of select="$idRef"/>'.split(/\s+/);
    bcdui.factory.objectRegistry.withObjects({
        ids: objectIds
      , fn: function() {
        objectIds.forEach(function(id){ bcdui.factory.objectRegistry.getObject(id).execute('<xsl:value-of select="$shouldRefresh"/>'=='true'); });
      }
    });
  </xsl:variable>
  <xsl:choose>
    <xsl:when test="../self::xapi:*">
      <xsl:value-of select="$onLoad" />
    </xsl:when>
    <xsl:otherwise>
      <span bcdComment="onCoreReady">
        <xsl:attribute name="bcdOnLoad">
          <xsl:value-of select="$onLoad"/>
        </xsl:attribute>
        <xsl:value-of select="*[false()]"/>
      </span>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template match="xapi:Javascript">
  <span>
    <xsl:copy-of select="@bcdComment"/>
    <xsl:attribute name="bcdOnLoad">
      <xsl:copy-of select="./text()"/>
    </xsl:attribute>
    <xsl:value-of select="*[false()]"/>
  </span>
</xsl:template>

<xsl:template match="xapi:JavascriptLines">
  <xsl:copy-of select="./text()"/>
</xsl:template>

</xsl:stylesheet>