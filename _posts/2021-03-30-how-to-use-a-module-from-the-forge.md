---
layout: post
title: "How to use a module from the Puppet Forge"
summary: "The Puppet Forge is a great source of modules, but it's not always easy to know how to use them."
image: PuppetForge_Icon.png
category: "module developer tips"
tags: [puppet, development, tutorials, introduction, forge]
---

The Puppet Forge is a great place to find content. Whether you're looking for a module to manage [SELinux contexts](https://forge.puppet.com/puppet/selinux), or [Windows registry settings](https://forge.puppet.com/puppetlabs/registry), or even major applications like [IBM WebSphere](https://forge.puppet.com/puppetlabs/websphere_application_server), you're almost certain to find it on the Forge.

Using that content is a different story though. It's generally left as an exercise to the reader to know which installation method is appropriate and how to use the module in your own infrastructure. This tutorial is designed as a basic guide for getting started with Forge content so you're not left looking at the page and wondering, "now what?"

*Please note that it's not intended to be exhaustive. If you're familiar with the ecosystem enough to identify areas that aren't covered, then this guide is probably not for you.*

## Choosing an installation method

There are a lot of download options, but generally speaking, a new user should choose either of these options, based on the tool you are using:

### If you are using Bolt:

Add the module to your project with `bolt module add <module name>`. This is the option shown under the Bolt installation method, and there's a link for more experienced users to find other ways of using modules with Bolt.

### If you are using Puppet:

The standard practice is to set up a control repository and list the modules you want to use in that repository's `Puppetfile`. You can [read more about a control repository](https://ospassist.puppet.com/hc/en-us/articles/360043625833-Deploying-code-What-the-heck-is-a-control-repo-) in the Open Source Puppet Assist portal, or just [clone our starter control repository](https://github.com/puppetlabs/control-repo) and jump in with both feet.

Now that you have a control repository, let's add a module. Click the *r10k or Code Manager* row in the installation methods and copy the line of code provided. Edit the `Puppetfile` in the root of your control repository and add that line to it. You're almost done, but now you have to see if that module has any dependencies, so scroll down just a bit and switch to the *Dependencies* tab if you see it. Add each listed dependency to your `Puppetfile` and check their dependencies too.

For example, if you wanted to use the [`puppet-nginx`](https://forge.puppet.com/modules/puppet/nginx) module, then your `Puppetfile` would end up looking like so. The versions are current as of Spring 2021

``` ruby
forge 'https://forge.puppet.com'

mod 'puppet/nginx',      '3.0.0'
mod 'puppetlabs/concat', '6.0.0'
mod 'puppetlabs/stdlib', '7.0.0'
```

## Using the module in your infrastructure

Generally speaking, the modules you'll find on the Puppet Forge are what we call *component modules*. This means that instead of using the module directly by declaring resources in `site.pp` or other manifest files, you will construct a lightweight *profile* class that describes a single technology stack.

For example, let's say that your team is building an application server, with a single-page web app frontend and an API, along with a simple Puppet module to manage it. Now let's say that you want to layer it with a high performance HTTP server to host all the static assets and take the load off your application that's better suited to host the API.

You might be tempted to just paste some resources from the nginx module into your own module and call it good, but doing that would leave you in an inflexible state where you couldn't try other HTTP servers, or add a memcached layer for greater performance, or even just run it bare for debugging purposes. Instead, you should wrap the two classes into a *profile* class that pulls together all the layers to make your whole application stack.


``` puppet
class profile::appserver (
  $asset_directory = '/opt/myapp/html/',
) {
  include nginx

  class { 'myapplication':
    asset_directory => $asset_directory,
  }

  # application landing page with all SPA assets
  nginx::resource::server {'www.myhost.com':
    www_root => $asset_directory,
  }

  # proxy the api endpoints to the running app server
  nginx::resource::location {'/api':
    proxy => 'http://127.0.0.1/' ,
    server => 'www.myhost.com'
  }
}
```

Not only does this give you flexibility to reshape your application by stacking different components together in interesting ways, but it's also super descriptive about what you're managing. The parts that you care to specify are right there in the profile, and all the gory implementation details are abstracted away into the component classes. You can look under the hood if you want to or need to troubleshoot, but for everyday use, it's quite sufficient to just twist the knobs provided.

For the most part, most every module you use from the Forge will be used like this






