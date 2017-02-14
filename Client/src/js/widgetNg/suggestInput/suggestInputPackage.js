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
 * The SuggestInput widget,
 * this supports native html5 (if browser is capable) or fallsback
 * to custom implemeentation.
 * Implementation specifics:
 * this widget uses 'bcdui.widgetNg.input' for the input control implementation
 * and adds handlers and options list around it.
 *
 * Additionally, a custom validation is attached to validate that entered value matches
 * one in the options model (required if allowNewItem is prohibited). This procedure is run everytime
 * the option model changes. Invalid values are not accepted by the widget.
 *
 * The option-model passed in is transparently wrapped by the multiWrapperOptions-wrapper and is used
 * as drop-in replacement for original options model. That wrapper supports optionsXPath with multiple
 * source references within xpath , i.e. $guiStatus//ClientSettings/Editor[@id = $editorData/currentEditor],
 * so it re-updates everytime either $guiStatus has changed on the target node and considers $editorData changes,
 * as well as implementing distinct-values and sorting.
 *
 * The datalist rendering (options list) is implemented differently for native and custom widgets:
 *
 * Custom implementation:
 *
 * The redisplaying of the options list is a separate action and updates the list (in HTML DOM) only in case
 * the options list is displayed. For building HTML options list a singleton renderer is utilized (in case
 * no custom renderer is suppplied otherwise each a custom renderer gets populated with widgets parameters),
 * which works in the wrapped options-model mentioned above. The renderer renders into a singleton datalist-element
 * which is repositioned for each widget when revealing the datalist for it, before rendering options for particular
 * widget the inputModel of a singleton renderer is swapped with the option-model of that widget, calling a 'rebind',
 * during entering keystrokes into the input field the renderer is invoked periodically (refineOptions) to adjust/filter
 * options for the current input whilst passing the current widget's value to the rendering processor.
 *
 * Native implementation:
 *
 * the options are renderered as soon as widget as constructed to the unique datalist element of a widget
 * (each widget has its down unique datalist element). That datalist is always re-freshed as options model
 * changes. There're no further handlers since implemented natively by the browser (i.e. revealing the list,
 * filtering by what user types etc)
 *
 * Custom Events:
 *
 * this widget uses custom events to handle visual effects. Logic which requires distinct flow must not / is not
 * implemented via event-based logic. The pattern for custom events is that an htmlElementId reference for target
 * (and optionally more parameters) are put into a 'memo' of such event (PrototypeJS API). Generally, events should
 * be considered handled deferred and detached from a default program flow.
 *
 * Particularry following events are implemented:
 *
 * - WIDGET_LEFT:
 *   this event is fired once user logically leaves the widget, here we handle the possible placeholder justifying
 */

/**
 * A namespace for the BCUDI GUI suggestInput widget.
 * @namespace bcdui.widgetNg.suggestInput
 * @private
 */
bcdui.util.namespace("bcdui.widgetNg.suggestInput",
/** @lends bcdui.widgetNg.suggestInput */
{
    /**
   * events defined in this package
   *
   * @static
   */
  EVENT : {
    /**
     * this event is fired once the user leaves the widget
     *
     * @static
     */
    WIDGET_LEFT : "bcd:widget.suggestInput.left"
  },

  /**
   * destroys given widget and frees resources
   * @private
   */
  _destroy : function(htmlElementId){
    var el = bcdui._migPjs._$(htmlElementId);
    if(! el.length > 0)return; // we cant tidy up what is not there anymore

    var config = el.data("_config_");
    config.isDestroyed = true;

    // ## now detach listeners
    if(config.listeners){
      jQuery.each(config.listeners, function(n,v){
        v.unregister();
      });
    }

    // ## move on with prototypeJS tidy up ##
    el.off();
    el.data("_args_",   null);
    el.data("_config_", null);
  },

  /**
   * initializes the widget according to the API,
   *
   * this init() function decides whether to initialize a native html5 or
   * a custom widget, depended on browsers capabitilies.
   *
   * The pattern is that internally there're different APIs (and even different flows) to
   * adopt to each implementation properly. Public APIs are common and delegate to either
   * implementation.
   *
   * A naming convention for native functions is _ntv_XXX (which all are private) for custom _cst_XXX respectively.
   *
   * Workflow of the init (general stuff):
   *
   * - add validator
   * - create options model wrapper _createWrapperModel() around options to apply multiOptionsModelWrapper.xslt supporting nested dependencies,
   *   this will be the only options data provider we use and sync to.
   * - attach listener on the options model wrapper to either validate the widget once options change or delete the value (see API)
   * - delegate to native or custom implementation subprocedure to attach handles for re-rendering the options list, etc.
   *
   */
  init : function(element){
    /* widget API */
//    id: htmlElement.getAttribute("bcdId") || undefined,
//    tabindex: htmlElement.getAttribute("bcdTabindex") || undefined,
//    hint: htmlElement.getAttribute("bcdHint") || undefined,
//    autofocus: htmlElement.getAttribute("bcdAutofocus") == "true" ? true : false,
//    targetHtmlElementId: htmlElement.getAttribute("bcdTargetHtmlElementId") || undefined,
//    disabled: htmlElement.getAttribute("bcdDisabled") == "true" ? true : false,
//    targetModelXPath: htmlElement.getAttribute("bcdTargetModelXPath") || undefined,
//    keepEmptyValueExpression: htmlElement.getAttribute("bcdKeepEmptyValueExpression") == "true" ? true : false,
//    required: htmlElement.getAttribute("bcdRequired") == "true" ? true : false,
//    readonly: htmlElement.getAttribute("bcdReadonly") == "true" ? true : false,
//    disableResetControl: htmlElement.getAttribute("bcdDisableResetControl") == "true" ? true : false,
//    pattern: htmlElement.getAttribute("bcdPattern") || undefined,
//    maxlength: htmlElement.getAttribute("bcdMaxlength") || undefined,
//    setCursorPositionAtEnd: htmlElement.getAttribute("bcdSetCursorPositionAtEnd") == "true" ? true : false,
//    isTextSelectedOnFocus: htmlElement.getAttribute("bcdIsTextSelectedOnFocus") == "true" ? true : false,
//    placeholder: htmlElement.getAttribute("bcdPlaceholder") || undefined,
//    type: htmlElement.getAttribute("bcdType") || 'text',
    /* hasOptions API */
//    optionsModelXPath: htmlElement.getAttribute("bcdOptionsModelXPath") || undefined,
//    doSortOptions: htmlElement.getAttribute("bcdDoSortOptions") || undefined,
//    wildcard: htmlElement.getAttribute("bcdWildcard") || 'contains',
//    allowNewItem: htmlElement.getAttribute("bcdAllowNewItem") == "false" ? false : true
    /* has html5 support api */
//    disableNativeSupport
    /* suggestInput */
//  suggestItemCount
    var rootContainer = bcdui._migPjs._$(element);
    var args = bcdui.widgetNg.impl.readParams.suggestInput(rootContainer.get(0));

    if(args.filterFunction && bcdui.util.isString(args.filterFunction)){
      args.filterFunction = eval(args.filterFunction);
    }

    // if browser supports html5 datalist
    var isNative = !args.disableNativeSupport && bcdui.browserCompatibility._hasFeature("input.list");

    // construct the default input widget

    if(!isNative){
      /*
       * if we have a custom implementation we also will be handling more stuff
       * within this package
       */
      bcdui.widgetNg.input.init(element,{
        hasCustomUpdateHandler: true,
        hasCustomPlaceholderHandler: true
      });
    }else{
      bcdui.widgetNg.input.init(element);
    }

    // according to bcdui.widgetNg.input initialization
    var controlElement = jQuery(rootContainer.find("input").get(0));

    // rewrite args+config and augment config
    var config = controlElement.data("_config_");
    controlElement.data("_args_", args);

    // we rely here on jQueryUI .remove() event
    controlElement.on("remove", bcdui.widgetNg.suggestInput._destroy.bind(undefined,controlElement.get(0).id));

    config.isNative = isNative;

    // dependencies to sync for
    config.dependencies = [config.target.modelId];

    var rawOptionsRef = bcdui.factory._extractXPathAndModelId(args.optionsModelXPath);
    // initially we also wait for the raw options model (will be wrapped later)
    if(rawOptionsRef.modelId){
      config.dependencies.push(rawOptionsRef.modelId);
    }

    // custom placeholder handling is only available in custom implementation
    if(args.placeholder && !bcdui.browserCompatibility._hasFeature("input.placeholder") && !isNative){
      // during writeback to the model, conditionally set placeholder
      controlElement.on(bcdui.widgetNg.utils.EVENT.SYNC_WRITE, function(event, memo){
        if(memo.isValueEmpty){
          bcdui.widgetNg.utils._setUnsetPlaceholder(event.target.id, true);
        }
      });
      // during syncing back from model set/reset placeholder
      controlElement.on(bcdui.widgetNg.utils.EVENT.SYNC_READ, function(event, memo){
        bcdui.widgetNg.utils._setUnsetPlaceholder(event.target.id, memo.isValueEmpty);
      });
      // remove the placeholder on-focus
      controlElement.on("focus",bcdui.widgetNg.utils._setUnsetPlaceholder.bind(undefined,controlElement.get(0).id, false));
      // add placeholder on widget-left
      controlElement.on(bcdui.widgetNg.suggestInput.EVENT.WIDGET_LEFT, function(event, memo){
        // make it deferred to allow potential blur() to occur
        setTimeout(bcdui.widgetNg.utils._setUnsetPlaceholder.bind(undefined,memo.htmlElementId, true));
      });
    }

    // complete initialization once dependencies has been loaded
    bcdui.widgetNg.suggestInput._setUnsetFieldLoadingStatus(controlElement.get(0), true);
    bcdui.factory.objectRegistry.withReadyObjects({
        ids:config.dependencies,
        fn:function(args, config, controlElement){
          // widget could have been destroyed meanwhile
          if(config.isDestroyed){
            return;
          }

          // now we can build our options model wrapper and wait for it to get ready, then proceeding with init
          // set addLowerCaseCaption to true because of optimized case-insensitive lookup
          bcdui.widgetNg.suggestInput._patchOptionsModel(args, config, controlElement, {addLowerCaseCaption:"true"}, args.optionsRendererId ? true : false);

          bcdui.factory.objectRegistry.withReadyObjects(config.source.modelId, function(){
            // widget could have been destroyed meanwhile
            if(config.isDestroyed){
              return;
            }
            // here we finalize the initialization
            try{
              if(config.isNative){
                bcdui.widgetNg.suggestInput._ntv_init(controlElement);
              }else{
                bcdui.widgetNg.suggestInput._cst_init(controlElement);
              }
            }finally{
              // attach validators
              bcdui.widgetNg.suggestInput._attachValidators(controlElement);
              // reset loadings status
              bcdui.widgetNg.suggestInput._setUnsetFieldLoadingStatus(controlElement, false);
              // run explicit validation
              bcdui.widgetNg.utils._validateElement(controlElement);
            }
          });
        }.bind(undefined,args, config, controlElement.get(0))
    });
  },

  /**
   * attaches the data change listener to the options model,
   * the listener is only attached in case it is required,
   * that is allowNewItem is set to FALSE
   *
   * @param args
   * @param config
   *
   * @private
   */
  _attachOptionsModelChangedListener: function(args, config, htmlElementId){
    if(args.allowNewItem === false){
      var el = bcdui._migPjs._$(htmlElementId);
      var config = el.data("_config_");
      // attach only if we have to know about changed options passively.
      var listener = bcdui.widgetNg.suggestInput._registerDataListener({
        idRef: config.source.modelId,
        trackingXPath: config.source.xPath,
        htmlElementId: bcdui._migPjs._$(htmlElementId).get(0).id,
        updateValueCallback: function(htmlElementId){

          // re-validate widget once options have changed
          var el = bcdui._migPjs._$(htmlElementId);
          var isValid = bcdui.widgetNg.utils.validateElement(el.get(0));
          // if not valid - remove the value
          if(!isValid){
            bcdui.widgetNg.suggestInput._syncWrite(htmlElementId,"");
          }

        }.bind(undefined,htmlElementId)
      });
      jQuery.extend(true, config , {listeners : { syncValueListener : listener }});
    }else{
      bcdui.log.isTraceEnabled() && bcdui.log.trace("skip attaching optionsmodelchanged listener on #" + htmlElementId);
    }
  },

  /**
   * builds multiModelWrapper around the options model, in case necessary
   * after execution the 'config' object get new properties:
   *
   * 'source.modelId'
   * 'source.xPath'                           the XPath pointing to CAPTION
   * 'source.valueXPath'                      the XPath pointing to VALUE, which is either xPath or optionsModelRelativeValueXPath + xPath
   * 'source.optionsModelRelativeValueXPath'  the XPath pointint to VALUE ( in case VALUE != CAPTION ), this is optional
   *
   *
   * @param args
   * @param config
   * @param controlElement
   * @param extraParams some extra params to optionsmodel factory, pls. see bcdui.widget._createWrapperModel() API
   * @param dontPatchIfSingleModel, if set to true, and there is only one model reference in source xpath, the source is not patched
   *        this also means that source model is not normalized. Te normalized model contains //Values/Value structure.
   *
   * @private
   * @return true if patched, false otherwise.
   */
  _patchOptionsModel: function(args, config, controlElement, extraParams, dontPatchIfSingleModel){
    // this block currenty uses bcdui.widget._createWrapperModel() which needs currently manual handling

    /*
     * initialize multiwrappermodel as our new options model.
     *
     *  _createWrapperModel() currently depends on: args.optionsModelId and args.optionsModelXPath
     *  and requires the array of referenced models, so we do it here. a TODO is to merge that function
     *  so it does everything on its own.
     */
    bcdui.log.isTraceEnabled() && bcdui.log.trace("optionsModelXPath: " + args.optionsModelXPath);
    var models=[];
    if(!args.optionsModelXPath.startsWith("$")){
      // fallback: no explicit reference found, assuming guiStatus as target
      models.push("$guiStatus");
    }
    var _refModels = bcdui.widget._extractModelsFromModelXPath(args.optionsModelXPath);
    if(_refModels != null){
      models = models.concat(_refModels);
    }
    models = models.reduce(function(a, b) { if(a.indexOf(b)===-1) a.push(b); return a; }, []);

    bcdui.log.isTraceEnabled() && bcdui.log.trace("optionsModelXPath references models: " + models);

    // _createWrapperModel() comatibility
    args.optionsModelId = models[0].replace(/\$/,""); // either implicit guiStatus here or referenced models
    args.element = controlElement;

    // enhancement: in case we have simple source reference and forced flag, we do so
    // FIXME: as internal options renderer is hardcoded to //Values/Value structure, also see _cst_prepareOptionsRendererId()
    if(models.length==1 && dontPatchIfSingleModel){
      // reference original model here
      config.source = {
          modelId: args.optionsModelId,
          xPath: args.optionsModelXPath.replace(/\$[^\/]+/,"")
      };
      if(args.optionsModelRelativeValueXPath){
        config.source.optionsModelRelativeValueXPath = args.optionsModelRelativeValueXPath;
        config.source.valueXPath = config.source.xPath + "/" + config.source.optionsModelRelativeValueXPath;
      } else {
        config.source.valueXPath = config.source.xPath;
      }
      bcdui.log.isTraceEnabled() && bcdui.log.trace("skip options-wrapper since we have one souce model and custom renderer",config);
      return false;
    }


    /*
     * respect API:
     *
     * [hasOptions]
     * - doSortOptions
     * - doRetainInputSchema
     */
    bcdui.widget._createWrapperModel(models, args, "widget/multiOptionsModelWrapper.xslt", jQuery.extend(
        {
          addLowerCaseCaption : "false"
        } //defaults
        ,
        {
          doRetainInputSchema:args.doRetainInputSchema,
          doSortOptions:args.doSortOptions
        }, // take only specific params
        extraParams)  // sample-in all extra params
    );

    /*
     * _createWrapperModel() adds/rewrites in the args:
     *
     * - optionsModelId
     * - optionsModelXPath
     * - optionsModelRelativeValueXPath
     *
     * we adopt it to our 'source' API
     */
    config.source = {
        modelId: args.optionsModelId,
        xPath: args.optionsModelXPath,
        optionsModelRelativeValueXPath : args.optionsModelRelativeValueXPath
    };
    config.source.valueXPath = config.source.xPath + "/" + config.source.optionsModelRelativeValueXPath;

    return true;
  },

  /**
   * attaches validators
   *
   * @param htmlElementId
   * @private
   */
  _attachValidators: function(htmlElementId){
    var ctx = bcdui.widgetNg.suggestInput._getContext(htmlElementId);
    if(ctx && ctx.args && ctx.args.allowNewItem == false){
      /*
       * see validators._existingValueValidator
       */
      throw "allowNewItem flag is not implemented";
    }
  },

  /**
   * local validators
   *
   * @private
   */
  _validators : {
    /**
     * validates thats current value is within available options
     *
     * @private
     */
    _existingValueValidator: function(htmlElementId){
      var ctx = bcdui.widgetNg.suggestInput._getContext(htmlElementId);
      if(!ctx)return;
      var currentValue = bcdui.widgetNg.validation.validators.widget.getValue(ctx.el);
      bcdui.log.isTraceEnabled() && bcdui.log.trace("VALIDATOR on source: " + ctx.config.source.modelId);
      var dataDoc = bcdui.factory.objectRegistry.getObject(ctx.config.source.modelId).getData();

      bcdui.log.isTraceEnabled() && bcdui.log.trace("validate value: '"+currentValue+"'");

      if(dataDoc == null || !currentValue.trim()){
        /*
         * no validation if the model has no data or we have an empty widget value
         */
        bcdui.log.isTraceEnabled() && bcdui.log.trace("skip validation due to NULL dataDoc or empty value");
        return null;
      }

      var testXPath = ctx.config.source.xPath + (ctx.config.source.optionsModelRelativeValueXPath ? "/" + ctx.config.source.optionsModelRelativeValueXPath : "");
      if (jQuery.makeArray(dataDoc.selectNodes(testXPath)).map(function(node){return node.text;}).indexOf(currentValue) == -1){
        // TODO replace by default i18n-token
        return {
          validationMessage: "value not allowed"
        }
      }else{
        return null;
      }
    }
  },

  /**
   * convienience function to retrieve the context on the htmlElementId
   * TODO: widget-global
   *
   * @param htmlElementId
   * @return {Object} null in case widget has been destroyed or Object with properties:
   *
   * - el: the Element (PrototypeJS wrap)
   * - config: configuration
   * - args: API args
   *
   * @private
   */
  _getContext: function(htmlElementId){
    var el = bcdui._migPjs._$(htmlElementId);
    if(!el||el.length==0){
      return null;
    }

    var config = el.data("_config_");
    if(!config || config.isDestroyed){
      return null;
    }

    return {
      el:el.get(0),
      config: config,
      args: el.data("_args_")
    }
  },

  /**
   * initializes a native html5 implementation, all dependencies are resolved and can be access here w/o sync
   *
   * - declares 'list'-attribute on the input-element and binds to the datalist
   * - attaches handlers to listen to options-model which populate the 'datalist' input element is bound to
   *
   * @param htmlElementId of the controller element (or the controller element itself)
   * @private
   */
  _ntv_init: function(htmlElementId){
    bcdui.log.isTraceEnabled() && bcdui.log.trace("native suggestion box initialization");
    var el = bcdui._migPjs._$(htmlElementId);
    var config = el.data("_config_");
    // build datalist
    config.dataListElementId = bcdui.widgetNg.suggestInput._ntv_createDataListElement(el.parent().get(0)).id;

    // update the data list initially
    bcdui.widgetNg.suggestInput._ntv_syncToOptionsProvider(el.get(0));

    // patch the control element: add 'list' attribute
    el.attr("list",config.dataListElementId);

    // register listener on the options to update the list
    bcdui.log.isTraceEnabled() && bcdui.log.trace("update listener on options provider registered");
    var listener = bcdui.widgetNg.suggestInput._registerDataListener({
      idRef: config.source.modelId,
      trackingXPath: config.source.xPath,
      htmlElementId: el.get(0).id,
      updateValueCallback: bcdui.widgetNg.suggestInput._ntv_syncToOptionsProvider.bind(undefined,el.get(0))
    });
    jQuery.extend(true, config , {listeners : { syncValueListenerNtv : listener }});
  },

  /**
   * registers HTML element / XML update listener, which terminates itself once
   * the htmlElement is not attached to HTML DOM anymore.
   * args:
   *
   * @param idRef
   * @param trackingXPath
   * @param htmlElementId
   * @param updateValueCallback
   *
   * @return listener instance
   * @private
   */
  _registerDataListener: function(args){
    var listener = new bcdui.widget.XMLDataUpdateListener({
      idRef: args.idRef,
      trackingXPath: args.trackingXPath,
      htmlElementId: args.htmlElementId
    });
    listener.updateValue = args.updateValueCallback;
    bcdui.factory.addDataListener(listener);
    return listener;
  },

  /**
   * syncs widget to options data provider and update the internal datalist element
   * with values from source and re-validates the widget.
   *
   * @param htmlElementId
   * @param optionElementName wrapping the option value
   *
   * TODO: should be changed to approach used for non-native implementation which allows
   * usage of custom options renderer (although complex layout is not supported by browsers,
   * we should use same implementation) once BCD-UI provides JsRenderer we can switch this
   * implementations to use renderers
   *
   * @private
   */
  _ntv_syncToOptionsProvider: function(htmlElementId){
    var el = bcdui._migPjs._$(htmlElementId);
    var config = el.data("_config_");
    var dataListEl = bcdui._migPjs._$(config.dataListElementId).get(0);

    bcdui.log.isTraceEnabled() && bcdui.log.trace("(_ntv_syncToOptionsProvider)updating the data list");

    // remove all options under dataListEl
    jQuery(dataListEl).empty();

    // copy all options into dataListEl
    bcdui.widgetNg.suggestInput._updateInternalOptions({
      htmlElementId: el.get(0),
      forEachFunc: function(index, attrNode){

        // dom api for speed
        var el = document.createElement("option");
        el.setAttribute("value", attrNode.text);

        dataListEl.appendChild(el);
      },
      onReadyFunc: function(el){
        // re-validate widget
        bcdui.widgetNg.utils._validateElement(el);
      }.bind(undefined,el.get(0))
    });
  },

  /**
   * this function syncs internal options list to options provided by data provider and executes given callback,
   * - this function also changes widgets UI state via _setUnsetFieldLoadingStatus()
   * - a field validation is triggered after options have been reloaded
   * (TODO REMOVE)
   * paramter in args:
   * @param htmlElementId {Object|String}
   * @param forEachFunc {Function} the callback function which is executed for each of found nodes according to .forEach() API
   * @param onReadyFunc {Function?} optional function to execute when we are ready iterating
   * @param doSort {Boolean} default FALSE; if TRUE the options are sorted via bcdui.widgetNg.utils.sorting.node.cmpAlphaIgnoreCase comparator.
   * @private
   */
  _updateInternalOptions: function(args){
    var ctx = bcdui.widgetNg.suggestInput._getContext(args.htmlElementId);
    if(!ctx)return;
    // set field to loading status
    bcdui.widgetNg.suggestInput._setUnsetFieldLoadingStatus(ctx.el, true);
    bcdui.factory.objectRegistry.withReadyObjects(ctx.config.source.modelId,function(){
      try{
        var nodes = jQuery.makeArray(bcdui.widgetNg.suggestInput._getOptionNodes(ctx.el));
        if(args.doSort){
          nodes = nodes.sort(bcdui.widgetNg.utils.sorting.node.cmpAlphaIgnoreCase);
        }
        jQuery.each(nodes, args.forEachFunc);
      }finally{
        // reset field to nonloading status
        bcdui.widgetNg.suggestInput._setUnsetFieldLoadingStatus(ctx.el, false);
        if(bcdui.util.isFunction(args.onReadyFunc)){
          args.onReadyFunc();
        }
      }
    },true);
  },

  /**
   * sets or unsets the widgets loading status, also considers
   * the 'allowNewItem' flag and if set, make the field 'readonly' while
   * it is in 'loading' state.
   * TODO: widget-global
   *
   * @private
   */
  _setUnsetFieldLoadingStatus: function(htmlElementId, isLoading){
    var ctx = bcdui.widgetNg.suggestInput._getContext(htmlElementId);
    if(!(ctx && ctx.args)){
      return;
    }
    if(isLoading){
      jQuery(ctx.el).addClass("bcdLoading");
      if(ctx.args.allowNewItem == false){
        jQuery(ctx.el).attr("readonly","readonly");
      }
    }else{
      jQuery(ctx.el).removeClass("bcdLoading");
      if(ctx.args.allowNewItem == false){
        jQuery(ctx.el).attr("readonly",null);
      }
    }
  },

  /**
   * creates a datalist element as a child of a given element
   *
   * @param htmlElementId the control element and returns it
   * @private
   */
  _ntv_createDataListElement: function(parentElement){
    var el = jQuery("<datalist id='" + parentElement.id + "_dataList" + "'></datalist>");
    parentElement.appendChild(el.get(0));

    return el.get(0);
  },

  /**
   * return the option nodes (wrapped into []) - requires the model and data to be up-to date, you
   * have to call this function after the object is initialized, an Error is thrown in case data-provider
   * is NOT ready.
   * (REMOVE)
   * @private
   * @return DOM NodeSet
   */
  _getOptionNodes: function(htmlElementId){
    var el = bcdui._migPjs._$(htmlElementId);
    var config = el.data("_config_");
    if (!config)
      return [];
    
    var dataProvider = bcdui.factory.objectRegistry.getObject(config.source.modelId);

    if(dataProvider == null){
      throw new Error("cannot read values as " + config.source.modelId + " is unknown.");
    }

    if(!dataProvider.isReady()){
      throw new Error("cannot read values as " + config.source.modelId + " is NOT ready.");
    }

    bcdui.log.isTraceEnabled() && bcdui.log.trace("reading values from " + config.source.xPath + " ( and relative value xpath: "+ config.source.optionsModelRelativeValueXPath +") of data provider " + config.source.modelId);

    return dataProvider.getData().selectNodes(config.source.xPath);
  },

  /**
   * initializes a custom implementation, all depependencies are resolved and can be access here w/o sync to
   * data providers.
   *
   * - creates a 'datalist' div-control containing the options
   * - attaches handlers to handle custom widget implementation
   *
   * @private
   */
  _cst_init: function(htmlElementId){
    bcdui.log.isTraceEnabled() && bcdui.log.trace("custom suggestion box initialization");
    var ctx = bcdui.widgetNg.suggestInput._getContext(htmlElementId);
    if(!ctx)return;

    // build datalist element
    bcdui.widgetNg.suggestInput._cst_getDataListElement();

    // prepare the options renderer
    bcdui.widgetNg.suggestInput._cst_prepareOptionsRendererId(htmlElementId);

    // attach options model listener to react to option model changes
    bcdui.widgetNg.suggestInput._attachOptionsModelChangedListener(ctx.args, ctx.config, htmlElementId);

    /*
     *  attach handlers
     */
    // reveal options box on focus
    jQuery(ctx.el).on("focus",bcdui.widgetNg.suggestInput._cst_revealOptions.bind(undefined,htmlElementId));
    // hide options box on leave TODO
    //jQuery(ctx.el).on("blur",bcdui.widgetNg.suggestInput._cst_hideOptions);
    // refine as user types
    jQuery(ctx.el).on("keyup",bcdui.widgetNg.suggestInput._cst_keyUpHandler.bind(undefined,ctx.el));
    // keyhandler for options box control
    jQuery(ctx.el).on("keydown", bcdui.widgetNg.suggestInput._cst_keyDownHandler.bind(undefined,ctx.el.id));
  },

  /**
   * control key set for fast lookup
   *
   * @private
   */
  _CONTROL_KEYS_MAP: (function(){
    var map={};
    [
     bcdui.util.Event.KEY_DOWN,
     bcdui.util.Event.KEY_UP,
     bcdui.util.Event.KEY_PAGEDOWN,
     bcdui.util.Event.KEY_PAGEUP,
     bcdui.util.Event.KEY_RETURN,
     bcdui.util.Event.KEY_TAB,
     bcdui.util.Event.KEY_ESC
     ].forEach(function(e){
      map[e+""]=1;
    });
    return map;
  })(),

  /**
   * refine options if no control key was published
   *
   * @private
   */
  _cst_keyUpHandler: function(htmlElement, event){
    if(!bcdui.widgetNg.suggestInput._CONTROL_KEYS_MAP[event.keyCode+""]){
      // refine option in case this is not a control key event
      bcdui.widgetNg.suggestInput._cst_refineOptions(htmlElement);
    }
  },

  /**
   * controls the selection in optionsbox
   *
   * @private
   */
  _cst_keyDownHandler: function(htmlElementId, event){
    if(!bcdui.widgetNg.suggestInput._cst_isOptionsListVisible()){
      /*
       * if options list is not visible we decide if to ignore the keyhit
       * or display the options list, in either case there is no further
       * handling for the key-hit
       */
      if(event.keyCode == bcdui.util.Event.KEY_DOWN || event.keyCode == bcdui.util.Event.KEY_PAGEDOWN){
        // roll out the optionslist
        bcdui.widgetNg.suggestInput._cst_revealOptions(htmlElementId);
      } else if(event.keyCode == bcdui.util.Event.KEY_RETURN || event.keyCode == bcdui.util.Event.KEY_TAB){
        // handle return here which means that is the cell loses focus
        bcdui.widgetNg.suggestInput._cst_handleWidgetLeft(htmlElementId);
      }
      return;
    }

    var el = bcdui._migPjs._$(htmlElementId);

    switch (event.keyCode) {
      case bcdui.util.Event.KEY_DOWN: {
        bcdui.widgetNg.suggestInput._cst_moveOptionSelection(1, el.get(0));
        break;
      }
      case bcdui.util.Event.KEY_UP: {
        bcdui.widgetNg.suggestInput._cst_moveOptionSelection(-1);
        break;
      }
      case bcdui.util.Event.KEY_PAGEDOWN: {
        bcdui.widgetNg.suggestInput._cst_moveOptionSelection(1);
        break;
      }
      case bcdui.util.Event.KEY_PAGEUP: {
        bcdui.widgetNg.suggestInput._cst_moveOptionSelection(-1);
        break;
      }
      case bcdui.util.Event.KEY_RETURN: {
        // consume event here to keep the field focused to allow user for further navigation
        event.stopPropagation();
        event.preventDefault();
        bcdui.widgetNg.suggestInput._cst_applyValueFromOptionsOrControl(htmlElementId);
        break;
      }
      case bcdui.util.Event.KEY_TAB:
        bcdui.widgetNg.suggestInput._cst_applyValueFromOptionsOrControl(htmlElementId);
        // handle widget left
        bcdui.widgetNg.suggestInput._cst_handleWidgetLeft(htmlElementId);
        break;
      case bcdui.util.Event.KEY_ESC:
        bcdui.widgetNg.suggestInput._cst_hideOptions();
        break;
    }
  },

  /**
   * updates value to the model, the value synced back to the model is either
   * taken from the dropdown box selected (if selected) or current widgets input
   * value is simpy synced to the model.
   *
   * @param htmlElementId
   * @private
   */
  _cst_applyValueFromOptionsOrControl: function(htmlElementId){
    var selectedElement = bcdui._migPjs._$(bcdui.widgetNg.suggestInput._cst_getSelectedOptionElement());
    if(selectedElement.length > 0){
      bcdui.widgetNg.suggestInput._syncWrite(htmlElementId, selectedElement.attr("bcdCaption"));
    }else{
      bcdui.widgetNg.suggestInput._syncWrite(htmlElementId);
    }
    bcdui.widgetNg.suggestInput._cst_hideOptions();
  },

  /**
   * @return currently selected element from the optionsbox or NULL or no selected element found OR box is not visible
   * @private
   */
  _cst_getSelectedOptionElement: function(){
    var optionsEl = bcdui._migPjs._$(bcdui.widgetNg.suggestInput._cst_getDataListElement());
    if(!optionsEl.is(":visible")){
      return null;
    }
    var selectedElement = optionsEl.find(".bcdOptionIsSelected");
    return selectedElement.length == 0 ? null : selectedElement[0];
  },

  /**
   * moves the selection in the options box according to the delta, stops on
   * top/last element, selects first one if none was selected
   *
   * @param delta {integer} one of [-1,1] a positive delta moves selection down
   * @param htmlElement {Object}
   * @private
   */
  _cst_moveOptionSelection: function(delta, htmlElement){
    var selectedElement = bcdui._migPjs._$(bcdui.widgetNg.suggestInput._cst_getSelectedOptionElement());

    var newSelectedElement = null;

    if(! selectedElement.length > 0){
      /*
       * nothing selected yet - take first option
       */
      var firstOption = jQuery(jQuery(bcdui._migPjs._$(bcdui.widgetNg.suggestInput._cst_getDataListElement()).children().get(0)).children().get(0));
      if(firstOption.length > 0){
        firstOption.addClass("bcdOptionIsSelected");
        newSelectedElement = firstOption.get(0);
      }
    }else{
      // move to next
      var nextElement = delta>0 ? selectedElement.next() : selectedElement.prev();
      // only move selection if we have next/previous item
      if(nextElement.length > 0){
        // unselected current element
        selectedElement.removeClass("bcdOptionIsSelected");
        // scroll to selected element
        bcdui.widgetNg.suggestInput._scrollToElement(selectedElement.parent().parent().get(0), selectedElement.get(0));
        // select next
        nextElement.addClass("bcdOptionIsSelected");
        newSelectedElement = nextElement.get(0);
      }
    }
  },
  
  /**
   * @private
   */
  _scrollToElement: function( scrollable, element ){
    var boxheight = bcdui._migPjs._$(scrollable).height();
    var height    = bcdui._migPjs._$(element).height();
    var top       = bcdui.util.positionedOffset(bcdui._migPjs._$(element).get(0)).top;
    if ( top +  height + 10  - scrollable.scrollTop >  boxheight ){
      scrollable.scrollTop = top;
      return;
    }else if ( top < scrollable.scrollTop ){
      scrollable.scrollTop = top - boxheight;
      return;
    }
  },

  /**
   * refines the options, that is redisplay the renderer,
   * the options box is not hidden during redisplay, the
   * options renderer may apply further logic like filtering
   * on the widget value etc, upon completion of rendering
   * this function checks if the dataListEl has children and
   * either .hide()s or .show()s it.
   *
   * TODO: this one works for non-native implementation only but should be also used to render native options
   *
   * @param el
   * @param cbAfterRedisplay
   *
   * @private
   */
  _cst_refineOptions: function(el, cbAfterRedisplay){
    bcdui.log.isTraceEnabled() && bcdui.log.trace("refining options");

    var ctx = bcdui.widgetNg.suggestInput._getContext(el);
    if(!ctx)return;
    var dataListEl = bcdui._migPjs._$(bcdui.widgetNg.suggestInput._cst_getDataListElement());
    var optionsRendererId = bcdui.widgetNg.suggestInput._cst_prepareOptionsRendererId(el);

    // make up this function since we will use it in more places
    var reDisplay = function() {
      bcdui.factory.reDisplay({
        idRef: optionsRendererId,
        forced : true,
        fn : function(){
          // either ensure visibility or hide the options box if no options found
          if( dataListEl.find("[bcdCaption]").length==0 ){
            // hide
            dataListEl.hide();
          }else{
            // show
            dataListEl.show();
          }

          if(cbAfterRedisplay){
            try{
              cbAfterRedisplay();
            }catch(e){
              bcdui.log.warn("error occured in cbAfterRedisplay callback", e);
            }
          }
        }
      });
    };

    /* rebind, just in case the box was bound to different target */
    if(dataListEl.attr("bcdBoundTo") != el.id){
      bcdui.widgetNg.suggestInput._cst_revealOptions(el, true);
    }

    var skipRedisplay = false;

    if(ctx.args.filterFunction){
      try{
        skipRedisplay = ctx.args.filterFunction({ htmlElementId:ctx.el.id, value:ctx.el.value, onComplete:reDisplay });
      }catch(e){
        skipRedisplay = false;
        bcdui.log.warn("error during filterKeyStroke execution", e);
      }
    }

    !skipRedisplay&&reDisplay();
  },

  /**
   * BINDS and reveals options box for given htmlElementId
   *
   * @param doRebindOnly : true if to skip refine-options, this is because of cyclic dependency
   *
   * @private
   */
  _cst_revealOptions: function(htmlElementId, doRebindOnly){
    bcdui.log.isTraceEnabled() && bcdui.log.trace("_cst_revealOptions");

    var ctx = bcdui.widgetNg.suggestInput._getContext(htmlElementId);
    if(!ctx)return;
    var el = ctx.el;
    var dataListEl = bcdui._migPjs._$(bcdui.widgetNg.suggestInput._cst_getDataListElement());

    dataListEl.hide();

    /*
     * rebind to given htmlElement
     */
    dataListEl.attr("bcdBoundTo", el.id);

    /*
     * TODO: offsetTop: obtain top from el offsetHeight so that options are display below the input field
     * but maybe also use another appraoach (with node re-attaching) to that positioning works automatically
     */
    // re-attach in node tree here
    el.parentNode.appendChild(dataListEl.get(0));
//    dataListEl.clonePosition(el,{
//      setHeight: false,
//      offsetTop: "15px"
//    });

    // reassign minimum width, TODO: in IE empty box still collapses by width, simulate min-width, since width has to be adjustable to its content
    dataListEl.css({
      "min-width": Math.round(bcdui._migPjs._$(el).outerWidth()*.8)+"px"
    });

    // rebuild options list
    if(doRebindOnly !== true){
      bcdui.widgetNg.suggestInput._cst_refineOptions( htmlElementId );
    }

    bcdui.log.isTraceEnabled() && bcdui.log.trace("_cst_ui_revealDataList() rebound to " + htmlElementId);
  },

  /**
   * hides the options list
   *
   * @private
   */
  _cst_hideOptions: function(){
    bcdui.log.isTraceEnabled() && bcdui.log.trace("_cst_hideOptions");
    bcdui._migPjs._$(bcdui.widgetNg.suggestInput._cst_getDataListElement()).hide();
  },

  /**
   * the ID of custom datalist singleton element to carry the options for
   * currently active input widget
   *
   * @private
   */
  _CST_DATALIST_ELEMENT_ID: "bcd_widget_suggestInput_dataList",

  /**
   *
   * @return {Boolean} true, if the options list is currently visible
   * @private
   */
  _cst_isOptionsListVisible: function(){
    return bcdui._migPjs._$(bcdui.widgetNg.suggestInput._CST_DATALIST_ELEMENT_ID).is(":visible");
  },

  /**
   * creates (if not already exists) a singleton datalist DIV container element
   * and attaches following handlers to it:
   *
   * - mouseover: this handler is used to visualize the selection while hovering with mouse
   * - click: this handler changes widgets value to that of picked element
   *
   * @return {Element} the datalist container element
   *
   * @private
   */
  _cst_getDataListElement: function(){
    var elId = bcdui.widgetNg.suggestInput._CST_DATALIST_ELEMENT_ID;
    var el = bcdui._migPjs._$(elId);

    if(! el.length > 0){
      el = jQuery("<div id='" + elId + "'></div>").css({position: "absolute"}).hide();
      document.body.appendChild(el.get(0));

      /*
       * attach handlers
       */

      // option highlighting
      el.on("mouseover", function(event){
        var currentEl = jQuery(event.target).closest("[bcdCaption]")||jQuery(event.target);
        // unhover old
        jQuery.each(currentEl.parent().find(".bcdOptionIsHovered"), function(i, e){
          jQuery(e).removeClass("bcdOptionIsHovered");
        });
        // hover new
        currentEl.addClass("bcdOptionIsHovered");
      });

      // option selection
      el.on("mousedown", function(event){
        // TODO: our value is located at an ancestor with bcdCaption attr, look it up
        var currentEl = jQuery(event.target).closest("[bcdCaption]");

        if(!currentEl.length > 0){
          // may happen if we have no values (empty box)
          return;
        }

        // write options value to the widget and sync it
        var optionsBoxEl = bcdui._migPjs._$(bcdui.widgetNg.suggestInput._CST_DATALIST_ELEMENT_ID);
        var htmlElementId = optionsBoxEl.attr("bcdBoundTo");
        bcdui.widgetNg.suggestInput._syncWrite(htmlElementId, currentEl.attr("bcdCaption"));
        // hide box
        bcdui.widgetNg.suggestInput._cst_hideOptions();
      });

      // we listen on global mousedown event on a document, inside we side when our
      // handler will be de-registered to prevent pollution.
      // widget-leave handling, we assume that MOUSEDOWN is fired before FOCUS event,
      // in case not, we have to split the logic of WIDGET_LEFT detection into FOCUS and MOUSEDOWN
      // or defer the detection - primarily because IE removes a focus from field during scrollbar
      // action.
      var mouseDownHdl = function(event){
        var dropDown = bcdui._migPjs._$(bcdui.widgetNg.suggestInput._CST_DATALIST_ELEMENT_ID);
        // if we dont have a singleton dropdown - we unregister our handler, since our factroy will craete a new
        // handler along with a new dropdown box, once a dropdown box is required
        if (!dropDown.length > 0){
          jQuery(document).off("mousedown", mouseDownHdl);
          return;
        }
        var boundToId = dropDown.attr("bcdBoundTo");
        bcdui.log.isTraceEnabled() && bcdui.log.trace("mousedown target element: " + event.target.id);
        /*
         * boundToId-value:
         *
         * 1) either is NULL/blank (so dropdown was never bound before)
         * 2) or refers to a (previously) bound element, via @bcdBoundTo attribute ( this case we care about )
         *
         * after MOUSEDOWN event a FOCUS is fired on target element, which also rebinds the dropdown box
         * to a new focused element, hence overriding the @bcdBoundTo value, since we're in MOUSEDOWN which
         * is fired *before* FOCUS event, we still have the old value the dropdownbox was bound to.
         *
         */
        if(
            boundToId != null
            && boundToId != event.target.id
            && event.target.id != bcdui.widgetNg.suggestInput._CST_DATALIST_ELEMENT_ID
            && !jQuery.contains(dropDown, event.target)){
          bcdui.widgetNg.suggestInput._syncWrite(boundToId);
          /*
           * handle only if:
           * - dropdown is bound
           * - target element other than dropdown bound to (click on same input-field is ignored)
           * - target element not the dropdown itself (descendant is not descendant-or-self)
           * - target element not inside the dropdown (ignore item selection click)
           */
          bcdui.widgetNg.suggestInput._cst_handleWidgetLeft(boundToId);
        }
      };
      jQuery(document).on("mousedown", mouseDownHdl);
    }

    return el;
  },

  /**
   * 1) hides the dropdown
   * 2) unbinds the dropdown
   * 3) checks for invalid status, if so reset the value
   * 4) fires WIDGET_LEFT
   *
   * @htmlElementId which has been left
   * @private
   * @static
   */
  _cst_handleWidgetLeft: function(htmlElementId){
    bcdui.log.isTraceEnabled() && bcdui.log.trace("_cst_handleWidgetLeft the input #" + htmlElementId);
    var dropDown = bcdui._migPjs._$(bcdui.widgetNg.suggestInput._CST_DATALIST_ELEMENT_ID);
    // hide
    if(dropDown.is(":visible")){
      dropDown.hide();
    }
    // unbind
    dropDown.attr("bcdBoundTo",null);
    var el = bcdui._migPjs._$(htmlElementId);
    // reset widget in case of invalid value
    if(!bcdui.widgetNg.validation.hasValidStatus(el.get(0))){
      // TODO - reset UI only, or reset DOM value or reset UI to DOM value?
      bcdui.log.warn("TODO: implement, retain from model");
    }
    // fire WIDGET_LEFT
    el.trigger(bcdui.widgetNg.suggestInput.EVENT.WIDGET_LEFT,{htmlElementId:htmlElementId});
  },

  /**
   * syncs current input value (or optionally given value) of the widget into model
   *
   * @param optNewValue {String?} if this value is given, the input control will be updated by this value and then synced to model
   *                              otherwise current controls value is synced to the model
   *
   * @private
   * @static
   */
  _syncWrite: function(htmlElementId, optNewValue){
    var el = bcdui._migPjs._$(htmlElementId);

    if(!el.length > 0){
      return;
    }

    if(bcdui.util.isString(optNewValue)){
      el.get(0).value = optNewValue;
    }
    bcdui.widgetNg.utils.updateValue(htmlElementId);
  },

  /**
   * the default singleton options renderer ID
   *
   * @private
   */
  _OPTIONS_RENDERER_ID : "bcd_widget_suggestInput_dataListRenderer",
  /**
   * is set to TRUE once a default options renderer is initialized and
   * can be synced thru _OPTIONS_RENDERER_ID, due to bcdui.factory.createRenderer()
   * which registered the renderer deferred (after dependencies are resolved) we cannot
   * check for existence of the renderer object in advance.
   *
   * @private
   */
  _DEFAULT_OPTIONS_RENDERER_INITIALIZED: false,

  /**
   * a singleton widget-value data provider passed to the options-renderer with the current widget-value
   *
   * @private
   */
  _WIDGET_VALUE_DATAPROVIDER: bcdui.factory.createConstantDataProvider({name: "bcdWidgetValue", value: null }),

  /**
   *
   * either retrieve a singleton renderer in case no custom provided, or retrieve custom one.
   * this function ensures that all widget specific parameters to renderer are rebound to given
   * widget.
   *
   * @param htmlElementId
   * @return {String} ID of the renderer
   * @private
   */
  _cst_prepareOptionsRendererId: function(htmlElementId){
    var ctx = bcdui.widgetNg.suggestInput._getContext(htmlElementId);
    if(!ctx)return;
    var rendererId = "", renderer = null;

    bcdui.factory.objectRegistry.getObject(bcdui.widgetNg.suggestInput._WIDGET_VALUE_DATAPROVIDER).value = ctx.el.value;

    // caching rocks, impl in rebindRendererParams() inner func
    if(ctx._optionsRenderer && ctx._optionsRenderer.boundTo == ctx.el.id){
      return ctx._optionsRenderer.rendererId;
    }

    // snapshot widget values to pass to options renderer
    var srcModel = bcdui.factory.objectRegistry.getObject(ctx.config.source.modelId);
    if(!srcModel){
      bcdui.log.error("srcModel is not registered(null), id: " + ctx.config.source.modelId);
    }
    var providers = [];
    // TODO enhancement: create static JsDataProvider every parameter, so we dont have to re-recreate data provider everytime; like _WIDGET_VALUE_DATAPROVIDER
    providers.push(new bcdui.core.ConstantDataProvider({ name: "bcdInputModelId",   value: ctx.config.source.modelId }));
    providers.push(new bcdui.core.ConstantDataProvider({ name: "bcdIsNative",       value: ctx.config.isNative }));
    providers.push(new bcdui.core.ConstantDataProvider({ name: "suggestItemCount",  value: ctx.args.suggestItemCount }));

    // rebind widget specific values : put this into separate function as it may happen that we have to re-init renderer deferred at it is not
    // known to ObjectRegistry right after construction
    var rebindRendererParams = function(renderer){
      // reset input document to options document of our widget
      renderer.dataProviders[0] = srcModel;
      renderer.modelParameterId = renderer.dataProviders[0].id;

      for(var i=0;i<providers.length;i++){
        renderer.addDataProvider(providers[i]);
      }

      // this for optimization so we dont need to rebind if we still are bound to same widget
      ctx._optionsRenderer = {
        boundTo : ctx.el.id,
        rendererId : renderer.id
      };
    };

    if(ctx.args.optionsRendererId){
      /* we have custom renderer */
      rendererId = ctx.args.optionsRendererId;
      renderer = bcdui.factory.objectRegistry.getObject(rendererId);

      var customStaticRebind = function(renderer){
        renderer.targetHTMLElementId = bcdui.widgetNg.suggestInput._CST_DATALIST_ELEMENT_ID;
        renderer.addDataProvider(bcdui.factory.objectRegistry.getObject(bcdui.widgetNg.suggestInput._WIDGET_VALUE_DATAPROVIDER));
      };

      /* rebind with static configuration */
      if(!renderer){
        bcdui.factory.objectRegistry.withObjects(rendererId,function(){ customStaticRebind(bcdui.factory.objectRegistry.getObject(rendererId)) });
      }else{
        customStaticRebind(renderer);
      }
    } else {
      /* we dont have custom renderer, use global one */

      rendererId = bcdui.widgetNg.suggestInput._OPTIONS_RENDERER_ID;

      if(!bcdui.widgetNg.suggestInput._DEFAULT_OPTIONS_RENDERER_INITIALIZED){
        bcdui.widgetNg.suggestInput._DEFAULT_OPTIONS_RENDERER_INITIALIZED = true;

        bcdui.log.isTraceEnabled() && bcdui.log.trace("creating singleton renderer with id: " + rendererId);

        /*
         * FIXME: once JavaScriptRenderer is available, implement such renderer to handle arbirtrary source.xPath (single),
         * as the current stylesheet is hardcoded to //Values/Value structure, but the source model is not always patched
         * via _patchOptionsModel() function hence the source structure is not always normalized.
         *
         * another approach (yet less efficient) is to keep using XSLTRenderer but with "patched" stylesheet which can
         * resolve dynamic source.xPath
         */
        bcdui.factory.createRenderer({
          id:         rendererId
          , targetHTMLElementId: bcdui.widgetNg.suggestInput._CST_DATALIST_ELEMENT_ID
          , url:      bcdui.config.jsLibPath + "widgetNg/suggestInput/optionsRenderer.xslt"
          , inputModel: bcdui.core.emptyModel
          , dataProviders: bcdui.widgetNg.suggestInput._WIDGET_VALUE_DATAPROVIDER
          , parameters: {
            bcdIsNative : ctx.config.isNative,
            suggestItemCount : ctx.args.suggestItemCount
          }
          , suppressInitialRendering: true
        });
        renderer = bcdui.factory.objectRegistry.getObject(rendererId);
      }
    }

    // immediate or later rebind
    if(!renderer){
      bcdui.factory.objectRegistry.withObjects(rendererId,function(){ rebindRendererParams(bcdui.factory.objectRegistry.getObject(rendererId)) });
    }else{
      rebindRendererParams(renderer);
    }

    return rendererId;
  }
});