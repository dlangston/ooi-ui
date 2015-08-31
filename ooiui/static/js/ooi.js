"use strict";
/*
 * ooiui/static/js/models/science/ArrayModel.js
 * An extension of Backbone.Model that manages relations with a back-ref id
 *
 * Dependencies
 * Libs
 * - ooiui/static/lib/underscore/underscore.js
 * - ooiui/static/lib/backbone/backbone.js
 * Usage
 */

/*
 * OOI is the main class that we extend to form the application instance for
 * each page.
 */
if(typeof(OOI) === "undefined") {
  var OOI = function() {
  }
}
OOI.Relation = {
  hasMany: 'hasMany'
}

/*
 * Use the RelationalModel to attach a collection to a Model that has
 * relational properties and a back-reference
 */
OOI.RelationalModel = Backbone.Model.extend({
  constructor: function(attributes, options) {
    Backbone.Model.apply(this, arguments);
    if(this.relation && this.relation.type === OOI.Relation.hasMany) {
      // bind the actual class to a variable so we can instantiate it.
      var collection = eval(this.relation.collectionType);
      // Create an instance of the class and bind it to the appropriate key
      this[this.relation.key] = new collection();
      // We need self in the following function declaration
      var self = this;
      this[this.relation.key].fetch = function(options) {
        if(typeof options === 'undefined') {
          options = {};
        }
        // The data parameters are defined by the relation
        if(options && options.data) {
          delete options.data;
        }

        // This is where the URL parameter is generated ?key=id
        var params = {};
        params[self.relation.reverseRelation.key] = self.get("id");
        options.data = $.param(params);
        // Call the original method
        collection.prototype.fetch.call(this, options);
      }.bind(this[this.relation.key]); // override "this" and bind it to our instance
    }
  }
});

/*
 * Logged in returns true if we have identified that the user is logged in.
 */
OOI.LoggedIn = function() {
    if($.cookie('ooiusertoken')) {
        return true;
    }
  return false;
}

OOI.LogOut = function() {
  $.removeCookie('ooiusertoken', { path: '/' });
  window.location.replace('/');
}

OOI.prototype.onLogin = function() {
    window.location.reload();
}
OOI.prototype.onLogout = function() {
    window.location.reload();
}


// TOC Functions
function renderTOCView( container, contents, streams ) {
    var tocView = new TOCView({
        arrayCollection:    container,
        assetCollection:    contents,
        streamCollection:   streams
    });
    tocView.render();
    // hide the spinner
    $('i#tocSpinner').hide();
    // append the toc
    $('#sidebar-wrapper').append( tocView.el );
    if ( contents != null ) {
        tocView.renderAssets();
    }
    if ( streams != null ) {
        tocView.renderStreams();
    }
}

function showSearchResults( collection ) {
    vent.trigger('toc:derenderItems');

    var searchResultView = new SearchResultView({ collection:collection });
    searchResultView.render();

    $('#assetBrowser').remove();

    $('i#tocSpinner').hide();
    $('#sidebar-wrapper').append(searchResultView.el);
}

function updateCollection( assetCallback ){
    var data = {
        search : $('#search-filter').val()
    };
    assetCollection.fetch({
        data : data,
        success : assetCallback,
    });

}

// global document controller

$(document).ready(function () {
    $('#search').width = "300px";
    $('#search-clear').hide();
    $('label.tree-toggler').click(function () {
        $(this).parent().children('ul.tree');
    });
});
