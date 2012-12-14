// Generated by CoffeeScript 1.4.0
(function() {
  var balUtilFlow, balUtilModules, balUtilPaths, balUtilTypes, isWindows, _ref, _ref1, _ref2, _ref3,
    __slice = [].slice;

  balUtilModules = null;

  balUtilFlow = require(__dirname + '/flow');

  balUtilPaths = require(__dirname + '/paths');

  balUtilTypes = require(__dirname + '/types');

  isWindows = (typeof process !== "undefined" && process !== null) && process.platform.indexOf('win') === 0;

  if ((_ref = global.numberOfOpenProcesses) == null) {
    global.numberOfOpenProcesses = 0;
  }

  if ((_ref1 = global.maxNumberOfOpenProcesses) == null) {
    global.maxNumberOfOpenProcesses = (_ref2 = process.env.NODE_MAX_OPEN_PROCESSES) != null ? _ref2 : 30;
  }

  if ((_ref3 = global.waitingToOpenProcessDelay) == null) {
    global.waitingToOpenProcessDelay = 100;
  }

  balUtilModules = {
    isWindows: function() {
      return isWindows;
    },
    openProcess: function(next) {
      if (global.numberOfOpenProcesses < 0) {
        throw new Error("balUtilModules.openProcess: the numberOfOpenProcesses is [" + global.numberOfOpenProcesses + "] which should be impossible...");
      }
      if (global.numberOfOpenProcesses >= global.maxNumberOfOpenProcesses) {
        setTimeout(function() {
          return balUtilModules.openProcess(next);
        }, global.waitingToOpenProcessDelay);
      } else {
        ++global.numberOfOpenProcesses;
        next();
      }
      return this;
    },
    closeProcess: function(next) {
      --global.numberOfOpenProcesses;
      if (typeof next === "function") {
        next();
      }
      return this;
    },
    spawn: function(command, opts, next) {
      balUtilModules.openProcess(function() {
        var err, pid, spawn, stderr, stdout, _ref4;
        spawn = require('child_process').spawn;
        _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
        pid = null;
        err = null;
        stdout = '';
        stderr = '';
        if (balUtilTypes.isString(command)) {
          command = command.split(' ');
        }
        if (balUtilTypes.isArray(command)) {
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
          balUtilModules.closeProcess();
          return next(err, stdout, stderr, code, signal);
        });
        if (opts.stdin) {
          pid.stdin.write(opts.stdin);
          return pid.stdin.end();
        }
      });
      return this;
    },
    spawnMultiple: function(commands, opts, next) {
      var command, results, tasks, _i, _len, _ref4;
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      results = [];
      tasks = new balUtilFlow.Group(function(err) {
        return next(err, results);
      });
      if (!balUtilTypes.isArray(commands)) {
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
    exec: function(command, opts, next) {
      balUtilModules.openProcess(function() {
        var exec, _ref4;
        exec = require('child_process').exec;
        _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
        return exec(command, opts, function(err, stdout, stderr) {
          balUtilModules.closeProcess();
          return next(err, stdout, stderr);
        });
      });
      return this;
    },
    execMultiple: function(commands, opts, next) {
      var command, results, tasks, _i, _len, _ref4;
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      results = [];
      tasks = new balUtilFlow.Group(function(err) {
        return next(err, results);
      });
      if (!balUtilTypes.isArray(commands)) {
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
    determineExecPath: function(possiblePaths, next) {
      var foundPath, possiblePath, tasks, _i, _len;
      foundPath = null;
      tasks = new balUtilFlow.Group(function(err) {
        return next(err, foundPath);
      });
      for (_i = 0, _len = possiblePaths.length; _i < _len; _i++) {
        possiblePath = possiblePaths[_i];
        if (!possiblePath) {
          continue;
        }
        tasks.push({
          possiblePath: possiblePath
        }, function(complete) {
          possiblePath = this.possiblePath;
          return balUtilModules.spawn([possiblePath, '--version'], function(err, stdout, stderr, code, signal) {
            if (err) {
              return complete();
            } else {
              foundPath = possiblePath;
              return tasks.exit();
            }
          });
        });
      }
      tasks.sync();
      return this;
    },
    getExecPath: function(executableName, next) {
      var key, path, pathUtil, paths, _i, _len;
      pathUtil = require('path');
      if (balUtilModules.isWindows()) {
        paths = process.env.PATH.split(/;/g);
      } else {
        paths = process.env.PATH.split(/:/g);
      }
      paths.unshift(process.cwd());
      for (key = _i = 0, _len = paths.length; _i < _len; key = ++_i) {
        path = paths[key];
        paths[key] = pathUtil.join(path, executableName);
      }
      balUtilModules.determineExecPath(paths, next);
      return this;
    },
    getHomePath: function(next) {
      var homePath, pathUtil;
      if (balUtilModules.cachedHomePath != null) {
        next(null, balUtilModules.cachedHomePath);
        return this;
      }
      pathUtil = require('path');
      homePath = process.env.USERPROFILE || process.env.HOME;
      homePath || (homePath = null);
      balUtilModules.cachedHomePath = homePath;
      next(null, homePath);
      return this;
    },
    getTmpPath: function(next) {
      var pathUtil, tmpDirName, tmpPath;
      if (balUtilModules.cachedTmpPath != null) {
        next(null, balUtilModules.cachedTmpPath);
        return this;
      }
      pathUtil = require('path');
      tmpDirName = isWindows ? 'temp' : 'tmp';
      tmpPath = process.env.TMPDIR || process.env.TMP || process.env.TEMP;
      if (!tmpPath) {
        balUtilModules.getHomePath(function(err, homePath) {
          if (err) {
            return next(err);
          }
          tmpPath = pathUtil.resolve(homePath, tmpDirName);
          if (!tmpPath) {
            return tmpPath = isWindows ? pathUtil.resolve(process.env.windir || 'C:\\Windows', tmpDirName) : '/tmp';
          }
        });
      }
      tmpPath || (tmpPath = null);
      balUtilModules.cachedTmpPath = tmpPath;
      next(null, tmpPath);
      return this;
    },
    getGitPath: function(next) {
      var pathUtil, possiblePaths;
      if (balUtilModules.cachedGitPath != null) {
        next(null, balUtilModules.cachedGitPath);
        return this;
      }
      pathUtil = require('path');
      possiblePaths = isWindows ? [process.env.GIT_PATH, process.env.GITPATH, 'git', pathUtil.resolve('/Program Files (x64)/Git/bin/git.exe'), pathUtil.resolve('/Program Files (x86)/Git/bin/git.exe'), pathUtil.resolve('/Program Files/Git/bin/git.exe')] : [process.env.GIT_PATH, process.env.GITPATH, 'git', '/usr/local/bin/git', '/usr/bin/git'];
      balUtilModules.determineExecPath(possiblePaths, function(err, gitPath) {
        balUtilModules.cachedGitPath = gitPath;
        if (err) {
          return next(err);
        }
        if (!gitPath) {
          return next(new Error('Could not locate git binary'));
        }
        return next(null, gitPath);
      });
      return this;
    },
    getNodePath: function(next) {
      var pathUtil, possiblePaths;
      if (balUtilModules.cachedNodePath != null) {
        next(null, balUtilModules.cachedNodePath);
        return this;
      }
      pathUtil = require('path');
      possiblePaths = isWindows ? [process.env.NODE_PATH, process.env.NODEPATH, (/node(.exe)?$/.test(process.execPath) ? process.execPath : ''), 'node', pathUtil.resolve('/Program Files (x64)/nodejs/node.exe'), pathUtil.resolve('/Program Files (x86)/nodejs/node.exe'), pathUtil.resolve('/Program Files/nodejs/node.exe')] : [process.env.NODE_PATH, process.env.NODEPATH, (/node$/.test(process.execPath) ? process.execPath : ''), 'node', '/usr/local/bin/node', '/usr/bin/node', '~/bin/node'];
      balUtilModules.determineExecPath(possiblePaths, function(err, nodePath) {
        balUtilModules.cachedNodePath = nodePath;
        if (err) {
          return next(err);
        }
        if (!nodePath) {
          return next(new Error('Could not locate node binary'));
        }
        return next(null, nodePath);
      });
      return this;
    },
    getNpmPath: function(next) {
      var pathUtil, possiblePaths;
      if (balUtilModules.cachedNpmPath != null) {
        next(null, balUtilModules.cachedNpmPath);
        return this;
      }
      pathUtil = require('path');
      possiblePaths = isWindows ? [process.env.NPM_PATH, process.env.NPMPATH, (/node(.exe)?$/.test(process.execPath) ? process.execPath.replace(/node(.exe)?$/, 'npm.cmd') : ''), 'npm', pathUtil.resolve('/Program Files (x64)/nodejs/npm.cmd'), pathUtil.resolve('/Program Files (x86)/nodejs/npm.cmd'), pathUtil.resolve('/Program Files/nodejs/npm.cmd')] : [process.env.NPM_PATH, process.env.NPMPATH, (/node$/.test(process.execPath) ? process.execPath.replace(/node$/, 'npm') : ''), 'npm', '/usr/local/bin/npm', '/usr/bin/npm', '~/node_modules/.bin/npm'];
      balUtilModules.determineExecPath(possiblePaths, function(err, npmPath) {
        balUtilModules.cachedNpmPath = npmPath;
        if (err) {
          return next(err);
        }
        if (!npmPath) {
          return next(new Error('Could not locate npm binary'));
        }
        return next(null, npmPath);
      });
      return this;
    },
    gitCommand: function(command, opts, next) {
      var performSpawn, _ref4;
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      if (balUtilTypes.isString(command)) {
        command = command.split(' ');
      } else if (!balUtilTypes.isArray(command)) {
        return next(new Error('unknown command type'));
      }
      performSpawn = function() {
        command.unshift(opts.gitPath);
        return balUtilModules.spawn(command, opts, next);
      };
      if (opts.gitPath) {
        performSpawn();
      } else {
        balUtilModules.getGitPath(function(err, gitPath) {
          if (err) {
            return next(err);
          }
          opts.gitPath = gitPath;
          return performSpawn();
        });
      }
      return this;
    },
    gitCommands: function(commands, opts, next) {
      var command, results, tasks, _i, _len, _ref4;
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      results = [];
      tasks = new balUtilFlow.Group(function(err) {
        return next(err, results);
      });
      if (!balUtilTypes.isArray(commands)) {
        commands = [commands];
      }
      for (_i = 0, _len = commands.length; _i < _len; _i++) {
        command = commands[_i];
        tasks.push({
          command: command
        }, function(complete) {
          return balUtilModules.gitCommand(this.command, opts, function() {
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
    nodeCommand: function(command, opts, next) {
      var performSpawn, _ref4;
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      if (balUtilTypes.isString(command)) {
        command = command.split(' ');
      } else if (!balUtilTypes.isArray(command)) {
        return next(new Error('unknown command type'));
      }
      performSpawn = function() {
        command.unshift(opts.nodePath);
        return balUtilModules.spawn(command, opts, next);
      };
      if (opts.nodePath) {
        performSpawn();
      } else {
        balUtilModules.getNodePath(function(err, nodePath) {
          if (err) {
            return next(err);
          }
          opts.nodePath = nodePath;
          return performSpawn();
        });
      }
      return this;
    },
    nodeCommands: function(commands, opts, next) {
      var command, results, tasks, _i, _len, _ref4;
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      results = [];
      tasks = new balUtilFlow.Group(function(err) {
        return next(err, results);
      });
      if (!balUtilTypes.isArray(commands)) {
        commands = [commands];
      }
      for (_i = 0, _len = commands.length; _i < _len; _i++) {
        command = commands[_i];
        tasks.push({
          command: command
        }, function(complete) {
          return balUtilModules.nodeCommand(this.command, opts, function() {
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
    npmCommand: function(command, opts, next) {
      var performSpawn, _ref4;
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      if (balUtilTypes.isString(command)) {
        command = command.split(' ');
      } else if (!balUtilTypes.isArray(command)) {
        return next(new Error('unknown command type'));
      }
      performSpawn = function() {
        command.unshift(opts.npmPath);
        return balUtilModules.spawn(command, opts, next);
      };
      if (opts.npmPath) {
        performSpawn();
      } else {
        balUtilModules.getNpmPath(function(err, npmPath) {
          if (err) {
            return next(err);
          }
          opts.npmPath = npmPath;
          return performSpawn();
        });
      }
      return this;
    },
    npmCommands: function(commands, opts, next) {
      var command, results, tasks, _i, _len, _ref4;
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      results = [];
      tasks = new balUtilFlow.Group(function(err) {
        return next(err, results);
      });
      if (!balUtilTypes.isArray(commands)) {
        commands = [commands];
      }
      for (_i = 0, _len = commands.length; _i < _len; _i++) {
        command = commands[_i];
        tasks.push({
          command: command
        }, function(complete) {
          return balUtilModules.npmCommand(this.command, opts, function() {
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
    initGitRepo: function(opts, next) {
      var branch, commands, gitPath, logger, output, path, remote, url, _ref4;
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      path = opts.path, remote = opts.remote, url = opts.url, branch = opts.branch, logger = opts.logger, output = opts.output, gitPath = opts.gitPath;
      remote || (remote = 'origin');
      branch || (branch = 'master');
      commands = [['init'], ['remote', 'add', remote, url], ['fetch', remote], ['pull', remote, branch], ['submodule', 'init'], ['submodule', 'update', '--recursive']];
      if (logger) {
        logger.log('debug', "Initializing git repo with url [" + url + "] on directory [" + path + "]");
      }
      balUtilModules.gitCommands(commands, {
        gitPath: gitPath,
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
      return this;
    },
    initOrPullGitRepo: function(opts, next) {
      var branch, path, remote, _ref4,
        _this = this;
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      path = opts.path, remote = opts.remote, branch = opts.branch;
      remote || (remote = 'origin');
      branch || (branch = 'master');
      balUtilPaths.ensurePath(path, function(err, exists) {
        if (err) {
          return complete(err);
        }
        if (exists) {
          opts.cwd = path;
          return balUtilModules.gitCommand(['pull', remote, branch], opts, next);
        } else {
          return balUtilModules.initGitRepo(opts, next);
        }
      });
      return this;
    },
    initNodeModules: function(opts, next) {
      var force, logger, nodeModulesPath, packageJsonPath, partTwo, path, pathUtil, _ref4;
      pathUtil = require('path');
      _ref4 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref4[0], next = _ref4[1];
      path = opts.path, logger = opts.logger, force = opts.force;
      opts.cwd = path;
      packageJsonPath = pathUtil.join(path, 'package.json');
      nodeModulesPath = pathUtil.join(path, 'node_modules');
      partTwo = function() {
        return balUtilPaths.exists(packageJsonPath, function(exists) {
          var command;
          if (!exists) {
            return next();
          }
          command = ['install'];
          if (force) {
            command.push('--force');
          }
          if (logger) {
            logger.log('debug', "Initializing node modules\non:   " + dirPath + "\nwith:", command);
          }
          return balUtilModules.npmCommand(command, opts, function() {
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
        });
      };
      if (force === false) {
        balUtilPaths.exists(nodeModulesPath, function(exists) {
          if (exists) {
            return next();
          }
          return partTwo();
        });
      } else {
        partTwo();
      }
      return this;
    }
  };

  module.exports = balUtilModules;

}).call(this);
