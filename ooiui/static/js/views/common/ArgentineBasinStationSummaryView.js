"use strict";


var ArgentineBasinStationSummaryView = Backbone.View.extend({

  initialize: function() {
    _.bindAll(this, "render");
    var self = this;
    self.render();
  },
  template: JST['ooiui/static/js/partials/ArgentineBasinStationSummary.html'],
  render: function() {
    this.$el.html(this.template());
  } 
});
