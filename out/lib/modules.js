// Generated by CoffeeScript 1.3.3
(function() {
  var balUtilFlow, balUtilModules, balUtilPaths,
    __slice = [].slice;

  balUtilModules = null;

  balUtilFlow = require(__dirname + '/flow');

  balUtilPaths = require(__dirname + '/paths');

  balUtilModules = {
    spawn: function(command, opts, next) {
      var err, pid, spawn, stderr, stdout, _ref;
      spawn = require('child_process').spawn;
      _ref = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref[0], next = _ref[1];
      pid = null;
      err = null;
      stdout = '';
      stderr = '';
      if (typeof command === 'string') {
        command = command.split(' ');
      }
      if (command instanceof Array) {
        pid = spawn(command[0], command.slice(1), opts);
      } else {
        pid = spawn(command.command, command.args || [], command.options || opts);
      }
      pid.stdout.on('data', function(data) {
        var dataStr;
        dataStr = data.toString();
        if (opts.output) {
          process.stdout.write(dataStr);
        }
        return stdout += dataStr;
      });
      pid.stderr.on('data', function(data) {
        var dataStr;
        dataStr = data.toString();
        if (opts.output) {
          process.stderr.write(dataStr);
        }
        return stderr += dataStr;
      });
      pid.on('exit', function(code, signal) {
        err = null;
        if (code !== 0) {
          err = new Error(stderr || 'exited with a non-zero status code');
        }
        return next(err, stdout, stderr, code, signal);
      });
      return this;
    },
    spawnMultiple: function(commands, opts, next) {
      var command, results, tasks, _i, _len, _ref;
      _ref = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref[0], next = _ref[1];
      results = [];
      tasks = new balUtilFlow.Group(function(err) {
        return next(err, results);
      });
      if (!(commands instanceof Array)) {
        commands = [commands];
      }
      for (_i = 0, _len = commands.length; _i < _len; _i++) {
        command = commands[_i];
        tasks.push({
          command: command
        }, function(complete) {
          return balUtilModules.spawn(this.command, opts, function() {
            var args, err;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            err = args[0] || null;
            results.push(args);
            return complete(err);
          });
        });
      }
      tasks.sync();
      return this;
    },
    exec: function(commands, opts, next) {
      var exec, _ref;
      exec = require('child_process').exec;
      _ref = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref[0], next = _ref[1];
      exec(command, opts, function(err, stdout, stderr) {
        return next(err, stdout, stderr);
      });
      return this;
    },
    execMultiple: function(commands, opts, next) {
      var command, results, tasks, _i, _len, _ref;
      _ref = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref[0], next = _ref[1];
      results = [];
      tasks = new balUtilFlow.Group(function(err) {
        return next(err, results);
      });
      if (!(commands instanceof Array)) {
        commands = [commands];
      }
      for (_i = 0, _len = commands.length; _i < _len; _i++) {
        command = commands[_i];
        tasks.push({
          command: command
        }, function(complete) {
          return balUtilModules.exec(this.command, opts, function() {
            var args, err;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            err = args[0] || null;
            results.push(args);
            return complete(err);
          });
        });
      }
      tasks.sync();
      return this;
    },
    getGitPath: function(next) {
      var foundGitPath, pathUtil, possibleGitPath, possibleGitPaths, tasks, _i, _len;
      pathUtil = require('path');
      foundGitPath = null;
      possibleGitPaths = process.platform.indexOf('win') !== -1 ? ['git', pathUtil.resolve('/Program Files (x64)/Git/bin/git.exe'), pathUtil.resolve('/Program Files (x86)/Git/bin/git.exe'), pathUtil.resolve('/Program Files/Git/bin/git.exe')] : ['git', '/usr/local/bin/git', '/usr/bin/git'];
      tasks = new balUtilFlow.Group(function(err) {
        return next(err, foundGitPath);
      });
      for (_i = 0, _len = possibleGitPaths.length; _i < _len; _i++) {
        possibleGitPath = possibleGitPaths[_i];
        tasks.push({
          possibleGitPath: possibleGitPath
        }, function(complete) {
          possibleGitPath = this.possibleGitPath;
          return balUtilModules.spawn([possibleGitPath, '--version'], function(err, stdout, stderr, code, signal) {
            if (err) {
              return complete();
            } else {
              foundGitPath = possibleGitPath;
              return tasks.exit();
            }
          });
        });
      }
      tasks.sync();
      return this;
    },
    getNodePath: function(next) {
      var nodePath, possibleNodePath;
      nodePath = null;
      possibleNodePath = /node$/.test(process.execPath) ? process.execPath : 'node';
      balUtilModules.spawn([possibleNodePath, '--version'], function(err, stdout, stderr, code, signal) {
        if (err) {

        } else {
          nodePath = possibleNodePath;
        }
        return next(null, nodePath);
      });
      return this;
    },
    initGitRepo: function(opts, next) {
      var branch, commands, gitPath, logger, output, path, remote, url, _ref;
      _ref = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref[0], next = _ref[1];
      path = opts.path, remote = opts.remote, url = opts.url, branch = opts.branch, gitPath = opts.gitPath, logger = opts.logger, output = opts.output;
      gitPath || (gitPath = 'git');
      commands = [
        {
          command: gitPath,
          args: ['init']
        }, {
          command: gitPath,
          args: ['remote', 'add', remote, url]
        }, {
          command: gitPath,
          args: ['fetch', remote]
        }, {
          command: gitPath,
          args: ['pull', remote, branch]
        }, {
          command: gitPath,
          args: ['submodule', 'init']
        }, {
          command: gitPath,
          args: ['submodule', 'update', '--recursive']
        }
      ];
      if (logger) {
        logger.log('debug', "Initializing git repo with url [" + url + "] on directory [" + path + "]");
      }
      return balUtilModules.spawnMultiple(commands, {
        cwd: path,
        output: output
      }, function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (args[0] != null) {
          return next.apply(null, args);
        }
        if (logger) {
          logger.log('debug', "Initialized git repo with url [" + url + "] on directory [" + path + "]");
        }
        return next.apply(null, args);
      });
    },
    npmCommand: function(command, opts, next) {
      var cwd, nodePath, npmPath, output, _ref;
      _ref = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref[0], next = _ref[1];
      nodePath = opts.nodePath, npmPath = opts.npmPath, cwd = opts.cwd, output = opts.output;
      npmPath || (npmPath = 'npm');
      if (typeof command === 'string') {
        command = command.split(' ');
      } else if (!(command instanceof Array)) {
        return next(new Error('unknown command type'));
      }
      command.unshift(npmPath);
      if (nodePath) {
        command.unshift(nodePath);
      }
      return balUtilModules.spawn(command, {
        cwd: cwd,
        output: output
      }, next);
    },
    initNodeModules: function(opts, next) {
      var command, force, logger, nodeModulesPath, packageJsonPath, path, pathUtil, _ref;
      pathUtil = require('path');
      _ref = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref[0], next = _ref[1];
      path = opts.path, logger = opts.logger, force = opts.force;
      opts.cwd = path;
      packageJsonPath = pathUtil.join(path, 'package.json');
      nodeModulesPath = pathUtil.join(path, 'node_modules');
      if (force === false && balUtilPaths.existsSync(nodeModulesPath)) {
        return next();
      }
      if (!balUtilPaths.existsSync(packageJsonPath)) {
        return next();
      }
      command = ['install'];
      if (force) {
        command.push('--force');
      }
      if (logger) {
        logger.log('debug', "Initializing node modules\non:   " + dirPath + "\nwith:", command);
      }
      balUtilModules.npmCommand(command, opts, function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (args[0] != null) {
          return next.apply(null, args);
        }
        if (logger) {
          logger.log('debug', "Initialized node modules\non:   " + dirPath + "\nwith:", command);
        }
        return next.apply(null, args);
      });
      return this;
    }
  };

  module.exports = balUtilModules;

}).call(this);
