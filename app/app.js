//styles
import 'angular-material/angular-material.css';
import './app.css';

//basic libraries
import 'lodash';
import 'angular';

//additional libraries
import angularMaterial from 'angular-material';
import uiRouter from 'ui-router';

var app = angular.module('firstApp', [
  uiRouter,
  angularMaterial,
  require('./components/components.js')
]);

app.config(function ($stateProvider, STATES) {
  $stateProvider
    .state(STATES.MAIN, {
        abstract: true,
        template: require('./main.html'),
        controller: 'mainController',
        controllerAs: 'mainCtrl'
    })
    .state(STATES.LOGIN, {
        template: require('./login.html'),
        controller: 'loginController',
        controllerAs: 'loginCtrl'
    })
    .state(STATES.USER, {
        template: require('./user.html'),
        controller: 'userController',
        controllerAs: 'userCtrl'
    });
});

app.constant('STATES', {
  MAIN: 'main',
  LOGIN: 'main.login',
  USER: 'main.user'
});

app.constant('TIMEOUTS', {
  COMET: 2000
});

app.run(function($state, userService, STATES){
  if(userService.hasUser()){
    $state.go(STATES.USER);
  } else {
    $state.go(STATES.LOGIN);
  }
});

app.service("statusService", function($http, $timeout, TIMEOUTS){
  var service = this;
  var statuses = [];
  var server_url = 'http://10.0.1.86:8080/statuses';
  //var server_url = 'http://localhost:3000/statuses';
  var _userStatuses = [];
  var _users = {};

  service.addStatus = _addStatus;
  service.getUsers = _getUsers;
  service.getStatuses = _getStatuses;
  init();

  function init(){
    var _getRequest = {
      method: "GET",
      url: server_url
    };

    $http(_getRequest).then(function(res){
      statuses = res.data;
      _updateUsers();
    }).finally(function(){
      $timeout(init, TIMEOUTS.COMET);
    });

  }
  function _getUsers(){
    return _users;
  }
  function _addStatus(newStatus){
    if(!_.isEmpty(newStatus.message)){

      var _postRequest = {
        method: "POST",
        url: server_url,
        data: newStatus
      };

      $http(_postRequest).then(_updateStatuses);

      function _updateStatuses(res){
        if(!!res){
          statuses.push(res.data);
          _updateUsers();
        }
      }

    } else {
      alert("Empty post");
    }
  };

  function _updateUsers(){

    var _sortedStatuses = _.sortBy(statuses, 'date').reverse();
    var userNames = _.uniq(_.map(statuses, 'user'));

    _.each(userNames, function getUserStatus(userName){

      var userStatus = _.find(_sortedStatuses, function(status){
        return status.user === userName;
      });

      if(!!userName){
        if(!_users[userName]){
          _users[userName] = {};
        }
        _users[userName].date = _.get(userStatus, 'date');
        _users[userName].message = _.get(userStatus, 'message');
      }

    });
  }

  function _getStatuses(username){
    if(_.isEmpty(username)){
      return [];
    } else {
      var filteredStatuses = _.filter(statuses, function(status){
        return status.user === username;
      });
    }
    return _.sortBy(filteredStatuses, 'date').reverse();
  }

});

app.service("userService", function(statusService){
  var service = this;
  var username_key = 'username';

  var user = {
    name: localStorage.getItem(username_key),
    password: undefined
  };

  service.setUser = _setUser;
  service.getUserName = _getUserName;
  service.hasUser = _hasUser;
  service.removeUser = _removeUser;

  function _setUser(vards){
    user.name = vards;
    if(_.isNull(user.name)){
      localStorage.removeItem(username_key);
      return false;
    } else {
      localStorage.setItem(username_key, user.name);
      return true;
    }
  };

  function _getUserName(){
    return user.name;
  };

  function _hasUser(){
    return !_.isNull(_getUserName());
  };

  function _removeUser(){
    return !_setUser(null);
  };

});

app.controller('mainController', function($state, userService, STATES){
  var viewModel = this;
  viewModel.hasUser = userService.hasUser;
  viewModel.getUserName = userService.getUserName;
  viewModel.logout = function(){
    if(userService.removeUser()){
      $state.go(STATES.LOGIN);
    }
  }
});

app.controller('loginController', function($state, userService, STATES){
  var viewModel = this;

  viewModel.login = _login;
  viewModel.vards = '';

  function _login(){
    if(userService.setUser(viewModel.vards)){
      $state.go(STATES.USER);
    };
  };

});

app.controller("userController", function(statusService, userService) {
  var viewModel = this;
  resetForm();

  viewModel.setStatus = function(){
    var _userToSend = {
      user: userService.getUserName(),
      message: viewModel.message,
      date: viewModel.date
    };
      statusService.addStatus(_userToSend);
      resetForm();
  };

  viewModel.clearStatus = function(){
    var _userToSend = {
      user: userService.getUserName(),
      message: ' ',
      date: viewModel.date
    };
      statusService.addStatus(_userToSend);
      resetForm();
  };

  function resetForm(){
    viewModel.name = '';
    viewModel.message = '';
    viewModel.date = new Date();
    $('#chatArea').scrollTop($('#chatArea')[0].scrollHeight - $('#chatArea')[0].clientHeight);
  };

});

app.controller('statusController', function(statusService, TIMEOUTS, mfDialog){
  var viewModel = this;

  viewModel.users = statusService.getUsers();
  viewModel.isRecent = _isRecent;
  viewModel.showHistory = _showHistory;

  function _isRecent(user){

    var now = new Date();
    var userDate = new Date(user.date);
    return (now - userDate) < TIMEOUTS.COMET * 2;
  };

  function _showHistory(user){
    mfDialog.show({
      template: require('./history.html'),
      controller: 'historyController',
      controllerAs: 'historyCtrl',
      clickOutsideToClose: true,
      locals: {
        'User': user
      }
    });
  }

});

app.controller('youtubeController', function(Url, statusService){
  var viewModel = this;
  viewModel.video_url = Url;
});

app.service("mfDialog", function($mdDialog){
  var service = this;
  var LOG_PREFIX = '[mfDialog]';
  var historyStack = [];

  service.show = function(options){

    if(_sameDialogs(_.last(historyStack), options)){
      return;
    }

    historyStack.push(options);
    //console.debug(LOG_PREFIX + 'Adding new dialog to the history.');
    //console.debug(LOG_PREFIX + JSON.stringify(options.controller));
    _showHistory();

    $mdDialog.show(options).finally(_handleHistory.bind(undefined, options));

    function _handleHistory(dialogOptions){
      if(_sameDialogs(_.last(historyStack), dialogOptions)){
        historyStack.pop();
        var prevDialog = _.last(historyStack);
        if(!!prevDialog){
          $mdDialog.show(prevDialog).finally(_handleHistory.bind(undefined, prevDialog));
        }
        _showHistory();
      }
    }
  }

  function _sameDialogs(first, second){
    return JSON.stringify(first) === JSON.stringify(second);
  }

  service.hide = function(){
    $mdDialog.hide();
  };

  function _showHistory(){
    //console.debug(LOG_PREFIX + ' Dialogs history: ');
    //console.debug(LOG_PREFIX + JSON.stringify(_.map(historyStack, 'controller')));
  }

});

app.controller('historyController', function(mfDialog, User, statusService){
  var viewModel = this;

  viewModel.username = User.name;
  viewModel.refresh = _refresh;

  _refresh();


  function _refresh() {
    viewModel.statuses = statusService.getStatuses(User.name);
  }

  viewModel.close = function(){
    mfDialog.hide();
  }

  viewModel.refresh = function(){
    //FIXME: refreshes the dialog list.
  }

});

app.filter('orderUsers', function(){
  var lastLists = {};

  return function orderUsersFilter(userMap, mapName){
    var userList = _.map(userMap, generateNewUser);
    var newList = _.sortBy(userList, 'date');

    if(!!mapName){
      if(JSON.stringify(lastLists[mapName]) !== JSON.stringify(newList)){
        lastLists[mapName] = newList;
      }
      return lastLists[mapName];
    } else {
      //FIXME: digest loop with no name.
      return newList;
    }

    function generateNewUser(status, name){
      var newUser = {
        name: name
      };

      _.defaults(newUser, status);

      return newUser;
    }

  }
});
