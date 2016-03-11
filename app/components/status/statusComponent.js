var module_name = 'firstApp.components.status';

var statusModule = angular.module(module_name, []);

statusModule.controller('mfStatusController', function($sce, mfDialog){

  var viewModel = this;
  var YT_REGEX = /^(http|https):\/\/(youtu\.be\/|((www\.|)youtube\.com\/watch\?v=))([a-zA-Z0-9]+).*$/i;
  $sce.trustAsResourceUrl('https://www.youtube.com');
  viewModel.getYT = _getYT;
  viewModel.showYT = _showYT;
  viewModel.isYT = _isYT;

  function _isYT(url){
    return YT_REGEX.test(url);
  }

  function _showYT(url){
    mfDialog.show({
      template: require('./youtube.html'),
      controller: 'youtubeController',
      controllerAs: 'ytCtrl',
      clickOutsideToClose: true,
      locals: {
        Url: _getYT(url)
      }
    });
  }

  function _getYT(url){
    var video_id = _.last(YT_REGEX.exec(url));
    var video_url = 'https://www.youtube.com/embed/' + video_id;
    return $sce.trustAsResourceUrl(video_url);
  }

});

statusModule.component('mfStatus', {
    template: require('./status.html'),
    controller: 'mfStatusController',
    bindings: {
      user: '='
    }
});

module.exports = module_name;
