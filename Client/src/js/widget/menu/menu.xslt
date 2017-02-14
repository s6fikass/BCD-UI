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
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:bcd="http://www.businesscode.de/schema/bcdui/html-extensions-1.0.0"
  xmlns:menu="http://www.businesscode.de/schema/bcdui/menu-1.0.0"
  >

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="no" />

  <!-- application context path -->
  <xsl:param name="contextPath" select="'/'"/>
  <xsl:param name="bcdControllerVariableName" select="'root_'"/>
  <!-- menu Id -->
  <xsl:param name="menuId"
    select="
    substring(concat('bcdDefault',/menu:Menu/@id), 1 + 10 * number( boolean(/menu:Menu/@id != '') ) )"
    />
  <!--
    root UL element Id
   -->
  <xsl:param name="rootElementId" select="concat($bcdControllerVariableName, 'MenuRoot')"/>
  <xsl:param name="selectedMenuItemId" select="''"/>
  <xsl:param name="location"/>
  <xsl:param name="bcdPageIdParam"/>

  <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              root template
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->
  <xsl:template match="/*">
    <div class="bcdMenu" style="display:none">
      <ul id="{$rootElementId}" class="bcdLevel1" db="{count(//menu:Entry)}">
        <xsl:for-each select="menu:Entry">
          <xsl:call-template name="getEntry">
            <xsl:with-param name="entry" select="."/>
            <xsl:with-param name="depth" select="number('2')"/>
          </xsl:call-template>
        </xsl:for-each>
      </ul>
    </div>
  </xsl:template>


  <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->
  <xsl:template name="getEntry">
    <xsl:param name="entry"/>
    <xsl:param name="depth" select="number('1')"/>

    <xsl:for-each select="$entry">
      <xsl:variable name="node" select="."/>
      <li>
        <xsl:attribute name="class">
          <xsl:if test="$node[@disable = 'true' or @hide = 'true']">
            <xsl:value-of select="substring(' bcdDisabled', 1 + 12 * number( boolean($node/@disable = 'false' or not($node/@disable)) ) )"></xsl:value-of>
            <xsl:value-of select="substring(' bcdHidden', 1 + 10 * number( boolean($node/@hide = 'false' or not($node/@hide)) ) )"></xsl:value-of>
          </xsl:if>
        </xsl:attribute>

        <xsl:call-template name="getLink">
          <xsl:with-param name="node" select="$node"/>
        </xsl:call-template>

        <xsl:if test="$node/menu:Entry">
          <ul class="bcdLevel{$depth}">
            <xsl:call-template name="getEntry">
              <xsl:with-param name="entry" select="$node/menu:Entry"/>
              <xsl:with-param name="depth" select="$depth+1"/>
            </xsl:call-template>
          </ul>
        </xsl:if>

      </li>
    </xsl:for-each>
  </xsl:template>


  <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->
  <xsl:template name="getLink">
    <xsl:param name="node"/>
    <xsl:param name="hasSubMenu" select="$node/menu:Entry"/>
    <xsl:variable name="isClickable" select="not($node[@disable = 'true' or @hide = 'true'])"/>
    <xsl:variable name="hRef">
      <xsl:choose>
        <xsl:when test="starts-with($node/@href,'/')"><xsl:value-of select="concat($contextPath,$node/@href)"/></xsl:when>
        <xsl:otherwise><xsl:value-of select="$node/@href"/></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <a>
      <xsl:if test="$isClickable">
        <xsl:attribute name="href">
          <xsl:value-of select="substring(concat('#', $hRef)
                      ,1 + 1 * number(boolean(string-length($hRef) &gt; 0))
                      )"/>
        </xsl:attribute>
      </xsl:if>

      <xsl:attribute name="class">
        <xsl:choose>
          <xsl:when test="$selectedMenuItemId != ''">
            <xsl:if test="$selectedMenuItemId = $node/@id"> bcdActive </xsl:if>
            <xsl:if test="$node//*[@id=$selectedMenuItemId]"> bcdActivePath </xsl:if>
          </xsl:when>
          <xsl:otherwise>

            <xsl:variable name="locationCheck">
              <xsl:choose>
                <xsl:when test="substring($location, string-length($location) - string-length('/') + 1) = '/'">
                  <xsl:value-of select="concat($location, 'index.')"/>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:value-of select="$location"/>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:variable>

            <xsl:if test="$locationCheck != ''">
              <xsl:choose>
                <xsl:when test="$bcdPageIdParam != ''">
                  <xsl:if test="starts-with($node/@href, $locationCheck) and contains($node/@href, $bcdPageIdParam)"> bcdActive </xsl:if>
                  <xsl:if test="$node//*[starts-with(@href, $locationCheck) and contains(@href, $bcdPageIdParam)]"> bcdActivePath </xsl:if>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:if test="starts-with($node/@href, $locationCheck)"> bcdActive </xsl:if>
                  <xsl:if test="$node//*[starts-with(@href, $locationCheck)]"> bcdActivePath </xsl:if>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:if>

          </xsl:otherwise>

        </xsl:choose>
        
        <xsl:if test="$node[@disable = 'true' or @hide = 'true']">
          <xsl:value-of select="substring(' bcdDisabled', 1 + 12 * number( boolean($node/@disable = 'false' or not($node/@disable)) ) )"></xsl:value-of>
          <xsl:value-of select="substring(' bcdHidden', 1 + 10 * number( boolean($node/@hide = 'false' or not($node/@hide)) ) )"></xsl:value-of>
        </xsl:if>
        <xsl:if test="$hasSubMenu"> bcdSubMenuContainer</xsl:if>
      </xsl:attribute>

      <xsl:if test="$isClickable and $node/@onClick">
        <xsl:attribute name="onclick"><xsl:value-of select="$node/@onClick"/></xsl:attribute>
      </xsl:if>

      <xsl:if test="$isClickable and $node/@newWindow = 'true'">
        <xsl:attribute name="target">_blank</xsl:attribute>
      </xsl:if>

      <xsl:if test="$node/@title != ''">
        <xsl:attribute name="title"><xsl:value-of select="$node/@title"/></xsl:attribute>
      </xsl:if>
      <xsl:if test="$node/@id != ''">
        <xsl:attribute name="id"><xsl:value-of select="$node/@id"/></xsl:attribute>
      </xsl:if>
      <xsl:copy-of select="$node/@bcdTranslate"/>
      <xsl:value-of select="$node/@caption"/>
    </a>
  </xsl:template>

</xsl:stylesheet>