"use strict";
/*
 * ooiui/static/js/views/common/TOCView.js
 * View definitions to build the table of contents
 *
 * Dependencies
 * Libs
 * - ooiui/static/lib/underscore/underscore.js
 * - ooiui/static/lib/backbone/backbone.js
 * - ooiui/static/js/ooi.js
 */


var TOCView = Backbone.View.extend({
    id: 'assetBrowser',
    events: {
        'keyup #search-filter' : 'filterToc'
    },
    initialize: function(options){
        _.bindAll(this, "render", "derender", "renderArrays", "renderAssets", "renderStreams");
        this.arrayCollection = options.arrayCollection;
        this.assetCollection = options.assetCollection;
        this.streamCollection = options.streamCollection;
        this.listenTo(vent, 'toc:derenderItems', function() {
            this.derender();
        });
    },
    template: JST['ooiui/static/js/partials/TOC.html'],
    renderArrays: function(){
        var arrayContainerView = this.arrayCollection.map(function(model) {
            return (new ArrayContainerView({ model:model })).render().el;
        });
        this.$el.find('ul.nav-list').append(arrayContainerView);
    },
    renderAssets: function(){
        // create a model for each item in the collection, and based on it's class,
        // render it in the browser as a platform or instrument.
        var filteredPlatforms = this.assetCollection.byClass('.AssetRecord');
        var filteredInstruments = this.assetCollection.byClass('.InstrumentAssetRecord');

        filteredPlatforms.map(function(model) {
            // get the array code from the reference designator
            var arrayCode = model.get('ref_des').substr(0,2);

            // set the target to where this item will be inserted.
            var arrayTarget = '#array_'+ arrayCode;
            if ( document.getElementById( model.get('ref_des').substring(0,8)) == null ) {

                var assetItemView = new AssetItemView({ model:model });

                $( arrayTarget ).append( assetItemView.render().el );
            }

        });

        filteredInstruments.map(function(model) {
            var coord = model.get('coordinates');

            var platformCode = model.get('ref_des').substr(0,8);

            // set the target to where this item will be inserted.
            var platformTarget = 'ul#'+platformCode;
            if ( document.getElementById( model.get('ref_des')) == null ) {
                var assetItemView = new AssetItemView({ model:model });

                $( platformTarget ).append( assetItemView.render().el );
            }
        });
    },
    renderStreams: function() {
        if ( this.streamCollection != undefined ) {
            this.streamCollection.map( function(model) {
                var instrumentCode = model.get('reference_designator');
                var instrumentTarget = 'ul#'+instrumentCode;
                var streamItemView = new StreamItemView({ model:model });
                $( instrumentTarget ).append( streamItemView.render().el );
            });
        }
    },
    render: function(){
        this.$el.html(this.template());
        this.renderArrays();
        this.$el.find('[data-toggle="tooltip"]').tooltip();
        return this;
    },
    derender: function() {
        this.remove();
        this.unbind();
    },
});

var SearchResultView = Backbone.View.extend({
    tagName: 'ul',
    initialize: function() {
        _.bindAll(this, 'render', 'derender', 'onClick');
        this.listenTo(vent, 'toc:derenderItems', function() {
            this.derender();
        });

    },
    onClick: function() {
        ooi.trigger('toc:selectItem', this.model);
    },
    render: function(){
        var assetItemView = this.collection.map(function(model) {
            var coord = model.get('coordinates');
            if (coord) {
                return(new AssetItemView({ model:model }).render().el);
            }
        });
        this.$el.html(assetItemView);
        return this;
    },
    derender: function() {
        this.remove();
        this.unbind();
    },
});

var ArrayContainerView = Backbone.View.extend({
    tagName: 'li',
    attributes: function(){
        return {
            'style': 'width:100%'
        };
    },
    events:{
        'click .nav-header' : 'onClick',
        'click label.tree-toggler': 'collapse'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'onClick', 'collapse');
        this.listenTo(vent, 'toc:derenderItems', function() {
            this.derender();
        });
    },
    collapse: function(e) {
        e.stopImmediatePropagation();
        this.$el.children('ul.tree').toggle(300);
    },
    onClick: function(e) {
                 ooi.trigger('toc:selectArray', this.model);
             },
    template: JST['ooiui/static/js/partials/ArrayItem.html'],
    render: function(){
        this.$el.html( this.template(this.model.toJSON()) );
        // this.$el.append('<li class="divider"></li>');
        this.$el.addClass('navLine');
        return this;
    },
    derender: function() {
        this.remove();
        this.unbind();
        this.model.off;
    },
})

var AssetItemView = Backbone.View.extend({
    tagName: 'li',
    events: {
        'click label.platform': 'onClickPlatform',
        'click label.instrument': 'onClickInstrument',
        'click label.tree-toggler': 'collapse'
    },
    initialize: function(options) {
        _.bindAll(this,'render', 'onClickPlatform', 'onClickInstrument', 'collapse');
        this.listenTo(vent, 'toc:derenderItems', function() {
            this.derender();
        });
        this.listenTo(vent, 'toc:cleanUp', function() {
            if ( this.$el.find('ul.tree').children().length == 0 ) {
                this.derender();
            }
        });
    },
    onClickPlatform: function() {
        ooi.trigger('toc:selectPlatform', this.model);
    },
    onClickInstrument: function() {
        ooi.trigger('toc:selectInstrument', this.model);
    },
    collapse: function(e) {
        e.stopImmediatePropagation();
        this.$el.children('ul.tree').toggle(300);
    },
    template: _.template('<label class="tree-toggler nav-header><%= assetInfo.name %></label>'),
    derender: function() {
        this.remove();
        this.unbind();
        this.model.off;
    },
    render: function() {
        // If the asset class is an AssetRecord, give the view an ID of the
        // first 8 characters of the Reference Designator
        if (this.model.get('asset_class') == '.AssetRecord') {
            var platformName = this.model.get('assetInfo').name;
            var platformId = this.model.get('ref_des').substr(0,8);
            this.$el.attr('id', platformId);
            this.$el.attr('class', 'platform');
            this.$el.html( this.template(this.model.toJSON()) );
            // since this is an AssetRecord (platform / glider) lets assume
            // it'll need to have instruments attached to it...so create a container!
            var label = (platformName == undefined) ? platformId : platformName;
            this.$el.append('<label class="platform tree-toggler nav-header">'+ label + '</label><ul id="'+ platformId +'" class="nav nav-list tree" style="display:none"></ul>');
        } else if(this.model.get('asset_class') == '.InstrumentAssetRecord') {
            // otherwise, if it's an InstrumentAssetRecord then give the view an ID
            // of the entire Reference Designator
            var instrumentName = this.model.get('assetInfo').name;
            var instrumentId = this.model.get('ref_des');
            this.$el.attr('id', instrumentId);
            this.$el.attr('class', 'instrument');
            this.$el.html( this.template(this.model.toJSON()) );
            var label = (instrumentName == undefined) ? instrumentId : instrumentName;
            this.$el.append('<label class="instrument tree-toggler nav-header">'+ label + '</label><ul id="'+ instrumentId +'" class="nav nav-list tree instrumentStyle" style="display: none"></ul>');
        }
        return this;
    }
});

var StreamItemView = Backbone.View.extend({
    tagName: 'li',
    events: {
        'click': 'onClick'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'derender', 'onClick');
        this.listenTo(vent, 'toc:denrenderItems', function() {
            this.derender();
        });
    },
    onClick: function(e) {
        e.stopImmediatePropagation();
        e.preventDefault();

        var param_list = []
        var parameterhtml = "";
        for (var i = 0; i < this.model.get('variables').length; i++) {
            if (param_list.indexOf(this.model.get('variables')) == -1){
                var parameterId = this.model.get('parameter_id')[i];
                var units = this.model.get('units')[i];
                var variable = this.model.get('variables')[i];
                parameterhtml+= "<option pid='"+ parameterId +"' data-subtext='"+ units +"' >"+ variable +"</option>";
                param_list.push(variable);
            }
        }
        $.when( ooi.trigger('toc:selectStream', { model: this.model }) ).done(function() {
            $("div#yvar0-selection-default > div.form-group > select").append(parameterhtml);
            $("div#yvar1-selection > div.form-group > select").append(parameterhtml);
            $("div#yvar2-selection > div.form-group > select").append(parameterhtml);
            $("div#yvar3-selection > div.form-group > select").append(parameterhtml);
            $('#parameters_id').removeAttr('disabled');
            $('.selectpicker').selectpicker('refresh');
        });

    },
    template: _.template('<a href="#"><%= stream_name %></a>'),
    derender: function() {
        this.remove();
        this.unbind();
        this.model.off;
    },
    render: function() {
        this.$el.attr('id', this.model.get('reference_designator') + '-' + this.model.get('stream_name'));
        this.$el.html( this.template(this.model.toJSON()) );
        return this;
    }
});
//--------------------------------------------------------------------------------
//  NestedItemView
//--------------------------------------------------------------------------------

var NestedTocItemView = Backbone.View.extend({

  display_name:"",
  sub_id: "",
  level:1,
  key:"",
  events:{
    'click a' : 'onClick',
  },
  stream_list:[],
  variable_list:[],
  initialize: function(options) {
    var self = this;
    if(options && options.level && options.key) {
      self.level = options.level;
      self.key = options.key;
    }
    if(options && options.display_name) {
      self.display_name = options.display_name;
    }
    if(options && options.sub_id) {
      self.sub_id = options.sub_id;
    }
    if(options && options.stream_list) {
      self.stream_list = options.stream_list;
    }
    if(options && options.variable_list) {
      self.variable_list = options.variable_list;
    }

  },
  template: JST['ooiui/static/js/partials/NestedTocItem.html'],
  onClick: function(e) {
    e.stopPropagation();
    this.toggle(e);
    
    if(this.level == 1){
      ooi.trigger('platformDeploymentItemView:platformSelect', this.model);
    }
    else if(this.level ==2){
      ooi.trigger('InstrumentItemView:instrumentSelect', this.model);
    }
    else if(this.level ==3){
      console.log(this.model);
    }
  },
  toggle: function(e) {
    var self = this

    var current = this.$el.find("ul a #"+(self.level)+"_icon")
    this.$el.find('#'+self.sub_id).collapse('toggle')

    if (current.hasClass("fa-rotate-90")){
        current.removeClass("fa-rotate-90");
        //this.$el.find("ul ."+(self.level+1)+"_item_content").removeClass("in")
    }
    else{
        current.addClass("fa-rotate-90");
        //this.$el.find("ul ."+(self.level+1)+"_item_content").addClass("in")
    }

    if (self.level ==3 ){
      self.instrumentSelect();
    }

  },
  instrumentSelect: function(){
    ooi.trigger('InstrumentItemView:instrumentSelect', this.model);
  },
    filterToc: function(){
        var self = this
    },
  render: function(){
    var self = this;
    var plottingLink = ""
    if(this.level == 3) {
      var mooring = self.model.get('mooring_code')
      var array = mooring.substr(0,2)
      var platform = self.model.get('platform_code')
      var ref = self.model.get('reference_designator')
      plottingLink = array+"/"+mooring+"/"+platform+"/"+ref
      var plottingLink = window.location.protocol + '//' + window.location.host+"/plotting/"+plottingLink
    }

    self.$el.html(self.template({plottingLink:plottingLink,display_name: self.display_name,sub_id : self.sub_id, key:self.key ,level: self.level}));

    if(this.level == 1) {
      self.$el.toggleClass('sidebar-nav-first-level');
      //this.$el.collapse('show');
    } else if(this.level == 2) {
      self.$el.toggleClass('sidebar-nav-second-level');
      //self.$el.find(self.key+"_item_content").addClass("collapse")
    } else if(this.level == 3) {
      self.$el.toggleClass('sidebar-nav-third-level');
      self.$el.find(self.key+"_item_content").addClass("collapse")
      //add popover
    }
  }
});
