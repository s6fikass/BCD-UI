<?xml version="1.0" encoding="UTF-8"?>
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
<!--
  Quite generic tool-tip, showing each attribute of wrs:C as caption-value, caption derived from wrs:Header
  -->

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:rnd="http://www.businesscode.de/schema/bcdui/renderer-1.0.0"
  xmlns:wrs="http://www.businesscode.de/schema/bcdui/wrs-1.0.0">

<xsl:import href="../../../xslt/renderer/numberFormatting.xslt"/>
<xsl:import href="../../../xslt/stringUtil.xslt"/>

<xsl:output method="html" version="1.0" encoding="UTF-8" indent="no"/>

<xsl:key name="columnDefinitionLookupById" match="/*/wrs:Header/wrs:Columns/wrs:C" use="@id"/>

<xsl:param name="bcdRowIdent"/>
<xsl:param name="bcdColIdent"/>
<xsl:variable name="sqlTypes" select="document('../../../xslt/renderer/sqlTypes.xml')"/>

<!--
  Overwrite this when specializing and importing this
 -->
<xsl:template match="/">
  <xsl:variable name="cell" select="/*/wrs:Data/wrs:R[@id=$bcdRowIdent]/wrs:C[number(key('columnDefinitionLookupById',$bcdColIdent)/@pos)]"/>
  <xsl:variable name="attr" select="$cell/@*[local-name()=/*/wrs:Header/wrs:Columns/wrs:C[@id=$bcdColIdent]/wrs:A/@id]"/>
  
  <xsl:call-template name="showAttrs">
    <xsl:with-param name="cell" select="$cell"/>
    <xsl:with-param name="attr" select="$attr"/>
  </xsl:call-template>
</xsl:template>

<!--
  Default behavior, show attributes of associated wrs:C 
  Shows only if there are values to show
  Shows two columns, one with the value's caption and one with the value itself
 -->
<xsl:template name="showAttrs">
  <xsl:param name="cell" select="/*/wrs:Data/wrs:R[@id=$bcdRowIdent]/wrs:C[number(key('columnDefinitionLookupById',$bcdColIdent)/@pos)]"/>
  <xsl:param name="attr" select="$cell/@*[local-name()=/*/wrs:Header/wrs:Columns/wrs:C[@id=$bcdColIdent]/wrs:A/@id]"/>
  <xsl:variable name="kpi" select="/*/wrs:Data/wrs:R[@id=$bcdRowIdent]/wrs:C[number(key('columnDefinitionLookupById','bcd_kpi_id')/@pos)]"/>
  <xsl:variable name="cellCaption" select="/*/wrs:Header/wrs:Columns/wrs:C[number(key('columnDefinitionLookupById',$bcdColIdent)/@pos)]/@caption"/>

  <xsl:if test="$attr[string(.)]">
    <table class="bcdTooltip">
      <xsl:if test="count($attr) &gt; 0 and $kpi/@caption != ''">
        <thead><tr><th><xsl:value-of select="$kpi/@caption"/></th></tr></thead>
      </xsl:if>
      <xsl:for-each select="$attr">
        <xsl:variable name="def" select="/*/wrs:Header/wrs:Columns/wrs:C[@id=$bcdColIdent]/wrs:A[@id=local-name(current())]"/>
        <tr>
          <th>
            <xsl:copy-of select="$def/@bcdTranslate"/>
            <xsl:value-of select="$def/@caption"/>:
          </th>
          <td>
            <xsl:choose>
              <xsl:when test="$sqlTypes/*/rnd:Numeric/rnd:Type[@name=$def/@type-name]">
                <xsl:call-template name="formatNumber">
                  <xsl:with-param name="columnDefinition" select="$def | $cell"/>
                </xsl:call-template>
              </xsl:when>
              <xsl:otherwise>
                <xsl:value-of select="."/>
              </xsl:otherwise>
            </xsl:choose>
          </td>
        </tr>
      </xsl:for-each>
      <xsl:if test="$cellCaption != ''">
        <xsl:variable name="caption">
          <xsl:call-template name="replaceString">
            <xsl:with-param name="str" select="$cellCaption"/>
            <xsl:with-param name="find" select="'|'"/>
            <xsl:with-param name="replacement" select="' / '"/>
          </xsl:call-template>
        </xsl:variable>
        <tr><td colspan="2" class="bcdFooter"><xsl:value-of select="$caption"/></td></tr>
      </xsl:if>
    </table>
  </xsl:if>
</xsl:template>

</xsl:stylesheet>