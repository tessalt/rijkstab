(function(){

  var url = 'https://www.rijksmuseum.nl/api/en/collection';

  var RijksTab = {

    config: {
      lang: 'en',
      key: 'Z8SzSYqp',
      format: 'json',
      toppieces: true,
      imgonly: true,
      type: 'painting',
      ps: 1
    },

    page: Math.floor(Math.random() * 4229),

    fetch: function() {
      return $.ajax({
        url: url,
        data: $.extend(this.config, {p: this.page})
      });
    },

    init: function() {
      this.fetch().then(function (arts){

      });
    }

  }

  var tab = Object.create(RijksTab);

  tab.fetch();

})();