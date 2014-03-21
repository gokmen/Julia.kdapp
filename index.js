/* Compiled by kdc on Fri Mar 21 2014 02:12:34 GMT+0000 (UTC) */
(function() {
/* KDAPP STARTS */
/* BLOCK STARTS: index.coffee */
var JuliaController, JuliaInstaller, LogWatcher, OutPath, domain, resource, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

LogWatcher = (function(_super) {
  __extends(LogWatcher, _super);

  function LogWatcher() {
    _ref = LogWatcher.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  LogWatcher.prototype.fileAdded = function(change) {
    var name, percentage, status, _ref1;
    name = change.file.name;
    _ref1 = name.split('-'), percentage = _ref1[0], status = _ref1[1];
    return this.emit("UpdateProgress", percentage, status);
  };

  return LogWatcher;

})(FSWatcher);

domain = "" + (KD.nick()) + ".kd.io";

OutPath = "/tmp/_juliainstaller.out";

resource = "https://gokmen.kd.io/apps/julia.kdapp";

JuliaInstaller = (function(_super) {
  __extends(JuliaInstaller, _super);

  function JuliaInstaller() {
    JuliaInstaller.__super__.constructor.call(this, {
      cssClass: "julia-installer"
    });
  }

  JuliaInstaller.prototype.viewAppended = function() {
    var _this = this;
    return KD.singletons.appManager.require('Terminal', function() {
      _this.addSubView(_this.header = new KDHeaderView({
        title: "Julia Installer",
        type: "big"
      }));
      _this.addSubView(_this.toggle = new KDToggleButton({
        cssClass: 'toggle-button',
        style: "clean-gray",
        defaultState: "Show details",
        states: [
          {
            title: "Show details",
            callback: function(cb) {
              _this.terminal.setClass('in');
              _this.toggle.setClass('toggle');
              _this.terminal.webterm.setKeyView();
              return typeof cb === "function" ? cb() : void 0;
            }
          }, {
            title: "Hide details",
            callback: function(cb) {
              _this.terminal.unsetClass('in');
              _this.toggle.unsetClass('toggle');
              return typeof cb === "function" ? cb() : void 0;
            }
          }
        ]
      }));
      _this.addSubView(_this.logo = new KDCustomHTMLView({
        tagName: 'img',
        cssClass: 'logo',
        attributes: {
          src: "" + resource + "/julialogo.png"
        }
      }));
      _this.watcher = new LogWatcher({
        path: OutPath
      });
      _this.addSubView(_this.progress = new KDProgressBarView({
        initial: 100,
        title: "Checking installation..."
      }));
      _this.addSubView(_this.terminal = new TerminalPane({
        cssClass: 'terminal'
      }));
      _this.addSubView(_this.button = new KDButtonView({
        title: "Install Julia",
        cssClass: 'main-button solid',
        loader: true,
        callback: function() {
          return _this.installCallback();
        }
      }));
      _this.addSubView(_this.link = new KDCustomHTMLView({
        cssClass: 'hidden running-link',
        partial: "Click here to launch Julia: <a target='_blank' href='http://" + domain + ":8998'>http://" + domain + ":8998</a>"
      }));
      _this.addSubView(_this.content = new KDCustomHTMLView({
        cssClass: "julia-help",
        partial: "<p>Julia is a high-level, high-performance dynamic programming language for technical computing, with syntax that is familiar to users of other technical computing environments.\nIt provides a sophisticated compiler, <a href=\"http://docs.julialang.org/en/release-0.2/manual/parallel-computing/\">distributed parallel execution</a>, numerical accuracy, and an <a href=\"http://docs.julialang.org/en/release-0.2/stdlib/\">extensive mathematical function library</a>.\nThe library, largely written in Julia itself, also integrates mature, best-of-breed C and Fortran libraries for <a href=\"http://docs.julialang.org/en/release-0.2/stdlib/linalg/\">linear algebra</a>, <a href=\"http://docs.julialang.org/en/release-0.2/stdlib/base/#random-numbers\">random number generation</a>, <a href=\"http://docs.julialang.org/en/release-0.2/stdlib/base/#signal-processing\">signal processing</a>, and <a href=\"http://docs.julialang.org/en/release-0.2/stdlib/base/#strings\">string processing</a>.\nIn addition, the Julia developer community is contributing a number of <a href=\"http://docs.julialang.org/en/latest/packages/packagelist/\">external packages</a> through Julia’s built-in package manager at a rapid pace. <a href=\"https://github.com/JuliaLang/IJulia.jl\" target=\"_blank\">IJulia</a>, a collaboration between the <a href=\"http://ipython.org\" target=\"_blank\">IPython</a> and Julia communities, provides a powerful browser-based graphical notebook interface to Julia.</p>\n<p>Julia programs are organized around <a href=\"http://docs.julialang.org/en/release-0.2/manual/methods/#man-methods\">multiple dispatch</a>; by defining functions and overloading them for different combinations of argument types, which can also be user-defined.\nFor a more in-depth discussion of the rationale and advantages of Julia over other systems, see the following highlights or read the <a href=\"http://docs.julialang.org/en/latest/manual/introduction/\">introduction</a> in the <a href=\"http://docs.julialang.org\">online manual</a>.</p>"
      }));
      return _this.checkJulia();
    });
  };

  JuliaInstaller.prototype.checkJulia = function() {
    var vmc,
      _this = this;
    vmc = KD.getSingleton('vmController');
    this.button.showLoader();
    return FSHelper.exists("/usr/bin/julia", vmc.defaultVmName, function(err, julia) {
      if (err) {
        warn(err);
      }
      return FSHelper.exists("/usr/bin/ipython", vmc.defaultVmName, function(err, ipython) {
        if (err) {
          warn(err);
        }
        if (julia && ipython) {
          _this.progress.updateBar(100, '%', "Checking for running instances...");
          return _this.isJuliaRunning(function(running) {
            var message, modal;
            if (running) {
              message = "Julia is running.";
              _this.link.show();
              _this.switchState('stop');
            } else {
              message = "Julia is not running.";
              _this.link.hide();
              _this.switchState('run');
              if (_this._lastRequest === 'run') {
                delete _this._lastRequest;
                modal = KDModalView.confirm({
                  title: 'Failed to run Julia',
                  description: 'It might not have been installed to your VM or not configured properly.<br/>Do you want to re-install Julia?',
                  ok: {
                    title: 'Re-Install',
                    style: 'modal-clean-green',
                    callback: function() {
                      modal.destroy();
                      _this.switchState('install');
                      _this.installCallback();
                      return _this.button.showLoader();
                    }
                  }
                });
              }
            }
            return _this.progress.updateBar(100, '%', message);
          });
        } else {
          _this.link.hide();
          _this.progress.updateBar(100, '%', "Julia is not installed.");
          return _this.switchState('install');
        }
      });
    });
  };

  JuliaInstaller.prototype.switchState = function(state) {
    var style, title,
      _this = this;
    if (state == null) {
      state = 'run';
    }
    this.watcher.off('UpdateProgress');
    switch (state) {
      case 'run':
        title = "Run Julia";
        style = 'green';
        this.button.setCallback(function() {
          return _this.runCallback();
        });
        break;
      case 'install':
        title = "Install Julia";
        style = '';
        this.button.setCallback(function() {
          return _this.installCallback();
        });
        break;
      case 'stop':
        title = "Stop Julia";
        style = 'red';
        this.button.setCallback(function() {
          return _this.stopCallback();
        });
    }
    this.button.unsetClass('red green');
    this.button.setClass(style);
    this.button.setTitle(title || "Run Julia");
    return this.button.hideLoader();
  };

  JuliaInstaller.prototype.stopCallback = function() {
    var _this = this;
    this._lastRequest = 'stop';
    this.terminal.runCommand("pkill -f 'ipython notebook --profile=julia'");
    return KD.utils.wait(3000, function() {
      return _this.checkJulia();
    });
  };

  JuliaInstaller.prototype.runCallback = function() {
    var _this = this;
    this._lastRequest = 'run';
    this.terminal.runCommand("ipython notebook --profile=julia --ip=* --browser='_' &");
    return KD.utils.wait(3000, function() {
      return _this.checkJulia();
    });
  };

  JuliaInstaller.prototype.installCallback = function() {
    var vmc,
      _this = this;
    this.watcher.on('UpdateProgress', function(percentage, status) {
      _this.progress.updateBar(percentage, '%', status);
      if (percentage === "100") {
        _this.button.hideLoader();
        _this.toggle.setState('Show details');
        _this.terminal.unsetClass('in');
        _this.toggle.unsetClass('toggle');
        return _this.switchState('run');
      } else if (percentage === "0") {
        _this.toggle.setState('Hide details');
        _this.terminal.setClass('in');
        _this.toggle.setClass('toggle');
        return _this.terminal.webterm.setKeyView();
      }
    });
    vmc = KD.getSingleton('vmController');
    return vmc.run("rm -rf " + OutPath + "; mkdir -p " + OutPath, function() {
      _this.watcher.watch();
      return _this.terminal.runCommand("curl --silent " + resource + "/installer.sh | bash");
    });
  };

  JuliaInstaller.prototype.isJuliaRunning = function(callback) {
    var vmc;
    vmc = KD.getSingleton('vmController');
    return vmc.run("pgrep -c -f 'ipython notebook --profile=julia'", function(err, res) {
      if (err || res.exitStatus > 0) {
        return callback(false);
      } else {
        return callback(parseInt(res.stdout, 10) > 1);
      }
    });
  };

  return JuliaInstaller;

})(KDView);

JuliaController = (function(_super) {
  __extends(JuliaController, _super);

  function JuliaController(options, data) {
    if (options == null) {
      options = {};
    }
    options.view = new JuliaInstaller;
    options.appInfo = {
      name: "Julia"
    };
    JuliaController.__super__.constructor.call(this, options, data);
  }

  return JuliaController;

})(AppController);

(function() {
  var view;
  if (typeof appView !== "undefined" && appView !== null) {
    view = new JuliaInstaller;
    return appView.addSubView(view);
  } else {
    return KD.registerAppClass(JuliaController, {
      name: "Julia",
      routes: {
        "/:name?/Julia": null,
        "/:name?/gokmen/Apps/Julia": null
      },
      dockPath: "/gokmen/Apps/Julia",
      behavior: "application"
    });
  }
})();

/* KDAPP ENDS */
}).call();