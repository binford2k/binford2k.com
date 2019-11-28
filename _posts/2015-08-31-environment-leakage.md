---
layout: post
title: "Environment Leakage"
summary: Only slightly less revolting than Olestra.
image: olestra.gif
tags: [puppet, "configuration management", programming, "cache is hard"]
---
Welcome back; gather 'round. Today we're going to talk about a topic we've all
been wondering how to bring up. We'll be talking about leakage--no, not *that
kind* of leakage!

(Those of you too young to get that joke are highly encouraged to not go look up
the history of Olestra in the late 1990s. That's a Wikipedia rabbit hole that you
really don't want to go down.)

> **Update**: In many cases, [environments no longer leak]({{ site.baseurl }}/2016/12/13/environments-no-longer-leak/) on Puppet 4.8 and above.

Today we'll be talking about environment leakage. First though, just for
completeness' sake, we'll need to define what environments are. At the simplest,
an environment is just a version of your Puppet codebase that's separate from
other environments. They're often used to delineate development stages, so you'd
have the `development`, `test`, and `production` environments. You may have heard
some variation of the phrase, "merge to production." This signifies that a certain
bit of code has been tested and is ready to move to the production stage in its
lifecycle.

![Environments]({{ site.baseurl }}/assets/images/environment_directories.png){:.rightside}

These environments are full copies of your codebase in a directory. When a node
requests a catalog, the master will identify the environment that node should
get and only the modules within that codebase are used to compile the catalog.
This means that a node assigned to the production environment will never get
code intended for the development environment.

Or will it? To answer that question, we'll need to dive into the innards of the compiler.

A Puppet codebase is made up of two types of code, Puppet DSL and Ruby.
Understanding this is critical to our leakage conversation. Most code that all
but the most advanced users have written is Puppet DSL.

``` puppet
class motd {
    file { '/etc/motd':
        owner   => 'root',
        group   => 'root',
        mode    => '0644',
        content => "Puppet is way cool!\n",
    }
}
```

If you need to extend the language or create additional native resource types,
though, you'd need to [write Ruby code using Puppet's plugin extension APIs](https://docs.puppetlabs.com/guides/custom_functions.html).
For example, you could add string manipulation functions to the language like such.

``` puppet
module Puppet::Parser::Functions
    newfunction(:reverse, :type => :rvalue) do |args|
        # reverse the first argument and return it
        args.first.reverse
    end
end
```

You can also write [types and providers](https://docs.puppetlabs.com/guides/custom_types.html)
to give Puppet the ability to natively manage more resource types2. Note that we
are talking about native plugins here. Defined types are a simpler form of
resource types that are [written in Puppet code](https://docs.puppetlabs.com/puppet/latest/reference/lang_defined_types.html).
I highly suggest that you use a defined type when possible for simplicity's sake.

So why are we blathering on about Ruby code? The key is that Ruby based plugins
are implemented by creating an instance of a class that's automatically
generated at runtime for each plugin you define. This means that when the
compiler reads Puppet code that uses your custom type, it will instantiate an
instance of that type's class so that it knows which attributes are available
and how to validate the values you pass in. Each of your functions and types
will have an instance in the compiler's memory space.

Now here's the critical part. The Ruby bytecode interpreter can only have a
single definition of any class in memory. That means that you cannot have more
than one version of the reverse function implemented. The first time the
function is used, Puppet will read and generate the class and from that point
forward, the implementation of that function is set.

If it were that straightforward and obvious, it would suck but it wouldn't be so
sneaky. Let's talk about threading for a moment. Most Puppet masters are
configured with some sort of process model in which a parent process will manage
a pool of compiler threads or processes. This is [how Apache works](http://httpd.apache.org/docs/2.4/mpm.html),
and by extension also [how Passenger works](https://www.phusionpassenger.com/library/config/apache/optimization/#step-3-configure-passenger).
To protect against the possibility of memory leaks, the compiler threads are
configured to die off after serving a certain number of requests. Each thread
will have its own instance of each plugin that's instantiated as Puppet builds
code using it. Once that thread dies, that bit of memory is released, and the
next thread will regenerate the classes in question.

Now here's the particularly pernicious bit: threads are not constrained to a
single environment, and you cannot predict which environment a thread will start
its life compiling. This means that the version of a Puppet plugin from one
environment can and will be used to compile code for another environment!
Yeowch!

So what's truly affected by this? Luckily, not much. Ruby code that is executed
by the master during catalog compilation will suffer from leakage, and the only
forms of leakage that will have effects that you'll notice are those that change
behaviour.

* If you update a native type and add or remove attributes then you'll get errors about invalid parameters.
* If you update a native type and the parameter validation changes, then the proper validation may not be used.
* If you update functions, the wrong version of the function may be executed.

Ruby code that is run on the agent, or code that is not run during compilation
is not affected. For example, the proper **provider** will always be used, even
if the **type** that was used to compile the catalog was not the proper version.
Code that is run outside of compilation, like report processors or Hiera
backends, will always be versions that are synced from the production
environment. Templates are also read and compiled on demand, so they're not
subject to leakage.

And echoing my suggestion from above, defined types written in Puppet code are
completely contained within their environment. Work is under process to provide
more extension points so that functions can be written directly in Puppet code
as well.

If you are developing custom Puppet plugins, then your best bet is to do so on a
standalone development workstation. Managing a Puppet VM [with Vagrant](https://docs.vagrantup.com/v2/getting-started/)
is nearly trivial to do these days.
