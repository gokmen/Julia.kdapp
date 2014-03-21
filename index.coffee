
class LogWatcher extends FSWatcher

  fileAdded:(change)->
    {name} = change.file
    [percentage, status] = name.split '-'
    @emit "UpdateProgress", percentage, status

domain     = "#{KD.nick()}.kd.io"
OutPath    = "/tmp/_juliainstaller.out"
resource   = "https://gokmen.kd.io/apps/julia.kdapp"

class JuliaInstaller extends KDView

  constructor:->
    super cssClass: "julia-installer"

  viewAppended:->

    KD.singletons.appManager.require 'Terminal', =>

      @addSubView @header = new KDHeaderView
        title         : "Julia Installer"
        type          : "big"

      @addSubView @toggle = new KDToggleButton
        cssClass        : 'toggle-button'
        style           : "clean-gray"
        defaultState    : "Show details"
        states          : [
          title         : "Show details"
          callback      : (cb)=>
            @terminal.setClass 'in'
            @toggle.setClass 'toggle'
            @terminal.webterm.setKeyView()
            cb?()
        ,
          title         : "Hide details"
          callback      : (cb)=>
            @terminal.unsetClass 'in'
            @toggle.unsetClass 'toggle'
            cb?()
        ]

      @addSubView @logo = new KDCustomHTMLView
        tagName       : 'img'
        cssClass      : 'logo'
        attributes    :
          src         : "#{resource}/julialogo.png"

      @watcher = new LogWatcher
        path          : OutPath

      @addSubView @progress = new KDProgressBarView
        initial       : 100
        title         : "Checking installation..."

      @addSubView @terminal = new TerminalPane
        cssClass      : 'terminal'

      @addSubView @button = new KDButtonView
        title         : "Install Julia"
        cssClass      : 'main-button solid'
        loader        : yes
        callback      : => @installCallback()

      @addSubView @link = new KDCustomHTMLView
        cssClass : 'hidden running-link'
        partial  : "Click here to launch Julia: <a target='_blank' href='http://#{domain}:8998'>http://#{domain}:8998</a>"

      @addSubView @content = new KDCustomHTMLView
        cssClass : "julia-help"
        partial  : """
          <p>Julia is a high-level, high-performance dynamic programming language for technical computing, with syntax that is familiar to users of other technical computing environments.
It provides a sophisticated compiler, <a href="http://docs.julialang.org/en/release-0.2/manual/parallel-computing/">distributed parallel execution</a>, numerical accuracy, and an <a href="http://docs.julialang.org/en/release-0.2/stdlib/">extensive mathematical function library</a>.
The library, largely written in Julia itself, also integrates mature, best-of-breed C and Fortran libraries for <a href="http://docs.julialang.org/en/release-0.2/stdlib/linalg/">linear algebra</a>, <a href="http://docs.julialang.org/en/release-0.2/stdlib/base/#random-numbers">random number generation</a>, <a href="http://docs.julialang.org/en/release-0.2/stdlib/base/#signal-processing">signal processing</a>, and <a href="http://docs.julialang.org/en/release-0.2/stdlib/base/#strings">string processing</a>.
In addition, the Julia developer community is contributing a number of <a href="http://docs.julialang.org/en/latest/packages/packagelist/">external packages</a> through Julia’s built-in package manager at a rapid pace. <a href="https://github.com/JuliaLang/IJulia.jl" target="_blank">IJulia</a>, a collaboration between the <a href="http://ipython.org" target="_blank">IPython</a> and Julia communities, provides a powerful browser-based graphical notebook interface to Julia.</p>
          <p>Julia programs are organized around <a href="http://docs.julialang.org/en/release-0.2/manual/methods/#man-methods">multiple dispatch</a>; by defining functions and overloading them for different combinations of argument types, which can also be user-defined.
For a more in-depth discussion of the rationale and advantages of Julia over other systems, see the following highlights or read the <a href="http://docs.julialang.org/en/latest/manual/introduction/">introduction</a> in the <a href="http://docs.julialang.org">online manual</a>.</p>
        """

      @checkJulia()

  checkJulia:->

    vmc = KD.getSingleton 'vmController'

    @button.showLoader()

    FSHelper.exists "/usr/bin/julia", vmc.defaultVmName, (err, julia)=>
      if err then warn err
      FSHelper.exists "/usr/bin/ipython", vmc.defaultVmName, (err, ipython)=>
        if err then warn err

        if julia and ipython
          @progress.updateBar 100, '%', "Checking for running instances..."
          @isJuliaRunning (running)=>
            if running
              message = "Julia is running."
              @link.show()
              @switchState 'stop'
            else
              message = "Julia is not running."
              @link.hide()
              @switchState 'run'
              if @_lastRequest is 'run'
                delete @_lastRequest

                modal = KDModalView.confirm
                  title       : 'Failed to run Julia'
                  description : 'It might not have been installed to your VM or not configured properly.<br/>Do you want to re-install Julia?'
                  ok          :
                    title     : 'Re-Install'
                    style     : 'modal-clean-green'
                    callback  : =>
                      modal.destroy()
                      @switchState 'install'
                      @installCallback()
                      @button.showLoader()

            @progress.updateBar 100, '%', message
        else
          @link.hide()
          @progress.updateBar 100, '%', "Julia is not installed."
          @switchState 'install'

  switchState:(state = 'run')->

    @watcher.off 'UpdateProgress'

    switch state
      when 'run'
        title = "Run Julia"
        style = 'green'
        @button.setCallback => @runCallback()
      when 'install'
        title = "Install Julia"
        style = ''
        @button.setCallback => @installCallback()
      when 'stop'
        title = "Stop Julia"
        style = 'red'
        @button.setCallback => @stopCallback()

    @button.unsetClass 'red green'
    @button.setClass style
    @button.setTitle title or "Run Julia"
    @button.hideLoader()

  stopCallback:->
    @_lastRequest = 'stop'
    @terminal.runCommand "pkill -f 'ipython notebook --profile=julia'"
    KD.utils.wait 3000, => @checkJulia()

  runCallback:->
    @_lastRequest = 'run'
    @terminal.runCommand "ipython notebook --profile=julia --ip=* --browser='_' &"
    KD.utils.wait 3000, => @checkJulia()

  installCallback:->
    @watcher.on 'UpdateProgress', (percentage, status)=>
      @progress.updateBar percentage, '%', status
      if percentage is "100"
        @button.hideLoader()
        @toggle.setState 'Show details'
        @terminal.unsetClass 'in'
        @toggle.unsetClass 'toggle'
        @switchState 'run'
      else if percentage is "0"
        @toggle.setState 'Hide details'
        @terminal.setClass 'in'
        @toggle.setClass 'toggle'
        @terminal.webterm.setKeyView()

    vmc = KD.getSingleton 'vmController'
    vmc.run "rm -rf #{OutPath}; mkdir -p #{OutPath}", =>
      @watcher.watch()
      @terminal.runCommand "curl --silent #{resource}/installer.sh | bash"

  isJuliaRunning:(callback)->
    vmc = KD.getSingleton 'vmController'
    vmc.run "pgrep -c -f 'ipython notebook --profile=julia'", (err, res)->
      if err or res.exitStatus > 0 then callback false
      else callback parseInt(res.stdout, 10) > 1


class JuliaController extends AppController

  constructor: (options = {}, data)->

    options.view    = new JuliaInstaller
    options.appInfo = name : "Julia"
    super options, data

do ->

  # In live mode you can add your App view to window's appView
  if appView?

    view = new JuliaInstaller
    appView.addSubView view

  else

    KD.registerAppClass JuliaController,
      name     : "Julia"
      routes   :
        "/:name?/Julia" : null
        "/:name?/gokmen/Apps/Julia" : null
      dockPath : "/gokmen/Apps/Julia"
      behavior : "application"