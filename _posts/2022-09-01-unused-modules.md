---
layout: post
title: "Cleaning up unused modules with Dropsonde"
summary:  If you're like most of us, you've gradually added more modules to your infrastructure and maybe sort of lost track of exactly what some of them do.
image: housekeeping.jpg
category:
tags: [puppet, telemetry, metrics, data, development, usage, forge, housekeeping]
---

You've probably been using Puppet Forge modules to manage bits in your infrastructure for years. And if you're like most of us, you've gradually added more modules and maybe sort of lost track of exactly what some of them do and on what nodes they're declared on. You may even suspect that you have modules installed that you haven't actually _used_ in years…. only you're not quite certain which modules those might be. I'm certainly guilty of that!

You won't be surprised to know that one of our most common customer requests is a way to audit their modules to identify which are no longer in use. Having these extra unused modules in your environments only serves as dead weight. Code deployments take longer, pluginsync takes longer, onboarding new team members takes longer because the cognitive load of understanding the codebase is greater. Each unused module only adds a tiny bit, but cumulatively, they can really add up.

Identifying and removing unused modules can give that time back to you and I'd like to tell you about a couple of tools and techniques for doing this. In general, there are three scenarios in which you'll want approach the problem:



* Infrastructure administrators looking at the environment want to know which modules can be removed. Sometimes they're looking at the control repo and sometimes they're looking at the codebase on the Puppet server.
* Module developers working on their own workstations want to know if there are unused parts of their modules that they can remove.
* Infrastructure teams and code reviewers want to know that all the code being reviewed is actually in use.

Today we'll talk about the Dropsonde telemetry project I've been working on. It can help with the first scenario. In the coming weeks we'll talk about another tool that can help with the others. Both of these tools use PuppetDB, so make sure you've got that [installed and configured](https://puppet.com/docs/puppetdb/latest/install_via_module.html).


## Ensuring that you have the right version installed

Let's start by checking to see if you have it installed, and installing or updating if not. Hop onto your primary server and check the version.

```
[root@northern-facade ~]# puppetserver dropsonde --version
dropsonde version 0.0.7
```


### Updating the gem

If the version is less than 0.0.8, then let's update it in-place to have the unused module detection. Pass the full path to ensure that the proper `gem` executable is called.

```
[root@northern-facade ~]# /opt/puppetlabs/puppet/bin/gem install dropsonde --install-dir /opt/puppetlabs/server/data/puppetserver/dropsonde --ignore-dependencies
```

For the rest of the tutorial, you'll use `puppetserver dropsonde` in examples.


### Installing the gem

If instead, you're informed that `'dropsonde' is not a puppetserver command`, then consider upgrading to a current release of Puppetserver. If that's not an option then you can  install a version you can use into the agent's ruby environment on your primary server. Pass the full path to ensure that the proper `gem` executable is called.

```
[root@northern-facade ~]# /opt/puppetlabs/puppet/bin/gem install dropsonde
```

For the rest of this tutorial, you'll pass the full path to the installed tool, `/opt/puppetlabs/puppet/bin/dropsonde`.


## Generating a system report

First things first. Dropsonde uses a cached list of all modules on the Puppet Forge. It will download this list the first time it's used, and then periodically update it afterwards. This might take a while, so let's kick off the process right away while you're reading the rest of the tutorial. Remember, if you're using the agent-installed gem, you'll need to use the full path mentioned above.

```
[root@northern-facade ~]# puppetserver dropsonde preview
Dropsonde caches a list of all Forge modules to ensure that it only reports
usage data on public modules. Generating this cache may take some time on
the first run and you'll see your screen fill up with dots.
Updating module cache...
............................................................................................................................................................................................................................................................................................................................................................................
```

While that's running, let's take a look at the tool itself. Ostensibly, Dropsonde is Puppet's built-in telemetry client, which is why it needs the list of Forge modules. We don't want to exfiltrate any private information about your infrastructure, so we report only on publicly published Forge modules. From the start Dropsonde was architected and designed to generate local reports whether you choose to submit them or not, and that's what we'll be using today. You can read [more about its design](/2020/05/15/telemetry-that-doesnt-suck/), if you'd like.

Dropsonde is built to be pluggable, meaning that each metric it reports on is generated by a plugin. As of writing, there are plugins to generate reports on the platforms you're managing with Puppet, any Ruby code invoked by your Puppetfiles, dependencies declared on public modules, and then information about public modules and classes themselves. This is the plugin that we'll be using today.

If the Forge cache is done downloading, you can scroll up to see what the telemetry report would look like. All data submitted is included in the output. We'll be looking at  the `modules` plugin to look for unused modules today. You'll see it listed in the report as `Dropsonde::Metrics::Modules`. If you'd like, you can run the report with only that plugin enabled (yes, the argument order is kind of weird, I'll fix that in a future release.)

```
[root@northern-facade ~]# puppetserver dropsonde --enable=modules preview
```

This will report on the modules installed in all environments, and on the classes declared on all nodes managed by this Puppetserver. This includes both explicit declarations that you specifically set and also transient declarations from modules you're using. It also reports the inverse--modules and classes that are *not* used.

```
[...]
- unused_modules: List of modules whose classes are not declared in any environments.
    apt
    stdlib
- unused_classes: List of unused classes in all environments.
    puppetdb::database::ssl_configuration
    puppetdb::master::report_processor
    firewall::linux::archlinux
[...]
```

Now you might be a little surprised at what you see here! Before you get excited and start removing modules, let's talk about what it means to be "unused".


## Interpreting the results

A Puppet module can contain many kinds of content; facts, functions, classes, types, even report processors or mini applications invoked as a Puppet subcommand. We cannot detect when some of these are in use. For example, if you had an external tool that ran `facter`, Dropsonde would have no way of knowing about it. And if you relied on my [`puppet parser itemize`](https://github.com/binford2k/binford2k-itemize) command we couldn't tell that you were running it. What we can reliably count is class declarations. The `unused_classes` list is classes that are not declared on any nodes in your infrastructure. And the `unused_modules` list is modules that contain classes, but *none of them* are declared on any nodes.

The `stdlib` module is listed because it contains a couple of classes that are rarely used. But you're almost certainly using the other components of that module. So be a little judicious before you actually remove a module. Take a look at its contents. Are there facts that other modules might use? Resource types or data types? This will take some judgment on your part, but for most modules it's usually pretty clear what parts of it might be used.


## Removing unused modules

The next part of this guide expect that you have a testing environment handy. This is not categorically _required_, but it's highly recommended as part of your standard workflow.

Once you've reviewed the modules, do the purge in a couple steps. First remove all the modules that are obviously not in use and run your test suite.  Deploy the codebase to your testing environment using your standard processes. Run tests and monitor the behaviour of nodes attached to this environment for a few days to ensure that everything has checked in and is still managing what you're expecting. Check your server logs for compilation failures and check reports to make sure each node is running and reporting as expected. Make sure you run through any other infrastructure tooling that might possibly use Puppet facts or subcommands and validate that they still work

Then deploy to production and repeat the monitoring process.

If something does break, then add that module back into your codebase and make a note directly in the `Puppetfile` with a ruby-style comment describing what it's used for:

```
mod 'dylanratcliffe-windows_disk_facts', '0.2.7'  # Facts used by the app deploy pipeline
```

For the second pass, break up the remaining unused modules into groups sized according to your own risk aversion. If you're not concerned about breakage or are confident that you can easily recover, then just crank them all out at once and get it done with. Many of us, though, would rather limit the number of things that could go wrong at once and might choose to remove only five modules at a time, following the same remove / deploy / test / monitor cycle as above.


## Automated reporting

Now that you've attained a clean environment without any unused modules, you might consider scripting a regular report to keep it that way. Dropsonde has a JSON output format that can be consumed by other tooling that can simplify this.

A simple Ruby script using that output might look like so:

``` ruby
#! /usr/bin/env ruby
require 'json'
require 'open3'

skiplist = [
  "windows_disk_facts",
   "stdlib",
]

# choose the appropriate command form based on how you installed the tool
#dropsonde = '/opt/puppetlabs/puppet/bin/dropsonde'
dropsonde  = '/opt/puppetlabs/bin/puppetserver dropsonde'

cmd = "#{dropsonde} --enable=modules preview --format=json"

stdout, stderr, status = Open3.capture3(cmd)

if status.success?
  report = JSON.parse(stdout)['self-service-analytics']['snapshots']
  unused = report['unused_modules']['value'] - skiplist

  puts 'Unused modules:'
  unused.each {|mod| puts "- #{mod}" }
else
  puts 'Report failed!'
  puts stderr
  exit 1
end
```

Add that script to a cron job on your primary Puppet server and make sure that the logs go somewhere reasonable, and you'll always know when you've got modules that you no longer need.


## Learn more

Watch out for the next post in this sequence and I'll teach you how a developer can use the `puppet-ghostbuster` gem on their own workstation to know what part of the codebase is worth spending time on and which can be removed.

* See other [posts about Dropsonde](/tags/#telemetry-ref) and other content analysis tools.
* See the [OnceOver project](https://github.com/dylanratcliffe/onceover) if you're just getting started testing your infrastructure code.
* If you want to get a jump on the next post, you can check out [puppet-ghostbuster](https://github.com/voxpupuli/puppet-ghostbuster) on your own.
