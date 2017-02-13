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
/**
 * Which js files are to be loaded for BCD-UI
 */
bcdui.bcduiCeFiles =
// JSON-PART-FOR-BUILD
{
  "groups": [
    {
      "id": "3rdParty",
      "required": "mandatory",
      "files": [
          "/js/3rdParty/modernizr.js"
        , "/js/3rdParty/log4javascript.js"
        , "/js/3rdParty/jquery.js"
        , "/js/3rdParty/jquery-ui.js"
        , "/js/3rdParty/ecma6Polyfills.js"
        , "/js/3rdParty/doT.js"
        , "/js/3rdParty/jquery.blockUI.js"
      ]
    },
    {
      "id": "bcduiUtil",
      "required": "mandatory",
      "files": [
          "/js/util/utilPackage.js"
        , "/js/util/datetimePackage.js"
        , "/js/util/clipboardPackage.js"
        , "/js/util/urlPackage.js"
        , "/js/util/xmlPackage.js"
        , "/js/util/bcdJQueryPlugins.js"
      ]
    },
    {
      "id": "bcduiCore",
      "required": "mandatory",
      "files": [
          "/js/bcdui.js"
        , "/js/settings.js"
        , "/js/core/corePackage.js"
        , "/js/core/statusHandling.js"
        , "/js/factory/objectRegistry.js"
        , "/js/log/logPackage.js"
        , "/js/core/abstractExecutable.js"
        , "/js/core/dataProvider.js"
        , "/js/core/browserCompatibility.js"
        , "/js/core/extendedBrowserCompatibility.js"
        , "/js/core/commonStatusObjects.js"
        , "/js/core/dataProviders.js"
        , "/js/core/transformators.js"
        , "/js/core/xmlLoader.js"
        , "/js/log/backendEventsPoller.js"
        , "/js/log/clientEventsPublisher.js"
        , "/js/core/abstractUpdatableModel.js"
        , "/js/core/simpleModel.js"
        , "/js/core/staticModel.js"
        , "/js/core/autoModel.js"
        , "/js/core/transformationChain.js"
        , "/js/core/event/eventPackage.js"
        , "/js/core/compression/compressionPackage.js"
        , "/js/factory/factoryPackage.js"
        , "/js/i18n/i18n.js"
        , "/js/i18n/i18nPackage.js"
        , "/js/core/lifecycle/lifecyclePackage.js"
        , "/js/wrs/wrsUtilPackage.js"
      ]
    },
    {
      "id": "bcduiWidget",
      "required": "mandatory",
      "files": [
          "/js/widget/widgetPackage.js"
        , "/js/widget/detachedEvent.js"
        , "/js/widget/mouseTracker.js"
        , "/js/widget/xmlDataUpdateListener.js"
        , "/js/widget/inputField/inputFieldPackage.js"
        , "/js/widget/singleSelect/singleSelectPackage.js"
        , "/js/widget/multiSelect/multiSelectPackage.js"
        , "/js/widget/dimensionChooser/dimensionChooserPackage.js"
        , "/js/widget/formulaEditor/formulaEditorPackage.js"
        , "/js/widget/formulaEditor/formulaParser.js"
        , "/js/widget/periodChooser/periodChooserPackage.js"
        , "/js/widget/periodChooser/popcalendar.js"
        , "/js/widget/notification/notificationsWidgetPackage.js"
        , "/js/widget/detailView/detailViewPackage.js"
        , "/js/widget/menu/menu.js"
        , "/js/widget/visualizeXml/visualizeXml.js"
        , "/js/widget/contextMenu/contextMenuPackage.js"
        , "/js/widget/tab/tabPackage.js"
        , "/js/widget/effects/effectsPackage.js"
        , "/js/widget/pageEffects.js"
        , "/js/widgetNg/capabilityPackage.js"
        , "/js/widgetNg/commons.js"
        , "/js/widgetNg/validators.js"
        , "/js/widgetNg/widgetPackage.js"
        , "/js/widgetNg/widgetImpl.js"
        , "/js/widgetNg/button/buttonPackage.js"
        , "/js/widgetNg/input/inputPackage.js"
        , "/js/widgetNg/dateInput/dateInputPackage.js"
        , "/js/widgetNg/textArea/textAreaPackage.js"
        , "/js/widgetNg/checkbox/checkboxPackage.js"
        , "/js/widgetNg/suggestInput/suggestInputPackage.js"
        , "/js/widgetNg/singleSelect/singleSelectPackage.js"
        , "/js/widgetNg/connectable/connectablePackage.js"
        , "/js/widgetNg/sideBySideChooser/sideBySideChooserPackage.js"
      ]
    },
    {
      "id": "bcduiChart",
      "required": "default",
      "files": [
          "/js/component/chart/chartPackage.js"
        , "/js/component/chart/chart.js"
        , "/js/component/chart/drawer.js"
        , "/js/component/chart/colorProvider.js"
        , "/js/component/chart/XmlChart.js"
      ],
      "buildFolders": [
        "/js/component/chart"
      ]
    },
    {
      "id": "bcduiCube",
      "required": "default",
      "files": [
          "/js/component/cube/cubeCreate.js"
        , "/js/component/cube/cubeConfigurator/cubeConfigurator.js"
        , "/js/component/cube/cubeConfigurator/cubeConfiguratorDND.js"
        , "/js/component/cube/templateManager/templateManager.js"
      ],
      "buildFolders": [
        "/js/component/cube"
      ]
    },
    {
      "id": "bcduiExport",
      "required": "default",
      "files": [
          "/js/component/exports/excelPackage.js"
        , "/js/component/exports/pdfExport.js"
        , "/js/component/exports/exportsPackage.js"
      ],
      "buildFolders": [
        "/js/component/exports"
      ]
    },
    {
      "id": "bcduiScorecard",
      "required": "default",
      "files": [
          "/js/component/scorecard/scorecardModel.js"
        , "/js/component/scorecard/scorecardCreate.js"
        , "/js/component/scorecard/bcdAspects.js"
      ],
      "buildFolders": [
        "/js/component/scorecard"
      ]
    },
    {
      "id": "bcduiTreeView",
      "required": "default",
      "files": [
        "/js/component/treeView/treeViewPackage.js"
      ],
      "buildFolders": [
        "/js/component/treeView"
      ]
    },
    {
      "id": "bcduiUserCalcEditor",
      "required": "default",
      "files": [
        "/js/component/userCalcEditor/userCalcEditorPackage.js"
      ],
      "buildFolders": [
        "/js/component/userCalcEditor"
      ]
    },
    {
      "id": "bcduiCustomElement",
      "required": "optional",
      "files": [
        "/js/3rdParty/webcomponents-lite.js" 
        , "/js/core/customElements.js"
        , "/js/widget/customElements.js"
        , "/js/widgetNg/customElements.js"
        , "/js/component/chart/customElements.js"
        , "/js/component/cube/customElements.js"
        , "/js/component/scorecard/customElements.js"
      ]
    }
  ]
}
// JSON-PART-FOR-BUILD
//Prepend to any already existing group definition, which may extend us
bcdui.bcduiFiles = bcdui.bcduiFiles || {};
if( typeof bcdui.bcduiFiles.groups != 'undefined' )
  bcdui.bcduiFiles.groups = bcdui.bcduiCeFiles.groups.concat(bcdui.bcduiFiles.groups);
else
  bcdui.bcduiFiles.groups = bcdui.bcduiCeFiles.groups;

// write css link for allStyles and jquery
document.write("<link rel='stylesheet' type='text/css' href='" + bcdui.config.contextPath + "/bcdui/theme/css/allStyles.css'>");
document.write("<link rel='stylesheet' type='text/css' href='" + bcdui.config.contextPath + "/bcdui/js/3rdParty/jquery-ui.css'>");

// construct bcdui.config.loadFiles array
(function(){
  var scripts = document.getElementsByTagName("script");
  for (var s = 0; s < scripts.length; s++) {
    var src = scripts[s].getAttribute("src");
    if (src != null) {
      var idx = src.indexOf("bcduiLoadFiles=");
      if (idx != -1) {
        bcdui.config.loadFiles = src.substring(idx + "bcduiLoadFiles=".length);
        var idx2 = bcdui.config.loadFiles.indexOf("&");
        bcdui.config.loadFiles = idx2 != -1 ? bcdui.config.loadFiles.substring(0, idx2).split(",") : bcdui.config.loadFiles.split(",");
        break;
      }
    }
  }
})();

// Let's load all the js requested files. May come from a parameter bcduiLoadFiles when loading bcdui.js
// If bcdui.config.loadFiles is not set: All mandatory plus default
// If bcdui.config.loadFiles is set: All mandatory plus listed ones 
bcdui.config.loadFiles = bcdui.config.loadFiles || [];
(function(){
  for (var g = 0; g < bcdui.bcduiFiles.groups.length; g++) {
    var group = bcdui.bcduiFiles.groups[g];

    var indexOf = -1;
    for (var i = 0; i < bcdui.config.loadFiles.length; i++) {
      if (bcdui.config.loadFiles[i] == group.id) {
        indexOf = i;
      }
    }

    if( group.required === "mandatory"
        || indexOf !== -1
        || ( bcdui.config.loadFiles.length === 0 && group.required === "default" ) ) {
      for (var f = 0; f < group.files.length; f++)
        document.write("<script type='text/javascript' src='" + bcdui.config.contextPath + "/bcdui" + group.files[f] + "'><\/script>");
    }
  }
  // and finally signal that all scripts are loaded 
  // IE8 loads the upper created scripts later so that the following bui loaded flagging only works for IE >8, therefore we check the object availability
  document.write("<script type='text/javascript'>bcdui && bcdui.log && bcdui.log.isDebugEnabled() && bcdui.log.debug('BCDUI lib is fully loaded');<\/script>");
})();
