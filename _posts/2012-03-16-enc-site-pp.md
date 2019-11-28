---
layout: post
title: "Using the ENC together with site.pp. What is this madness?"
summary: "How Puppet mixes the ENC and site.pp"
image:
category:
tags: ["system administration", puppet]
---
Puppet has this real neat concept of an external node classifier (ENC) that lets
you define your nodes in some way that's not Puppet. If you have your nodes
stored in anything from an LDAP database to even an Excel spreadsheet and you
can write a script to connect to your datasource, then Puppet can call it to
create its node definitions as it runs.

The idea of an ENC is so neat in fact, that we even use it internally for tools
like the Puppet Enterprise Console which gives system administrators the
capability to classify and configure nodes from a highly usable pointy clicky
web interface. [aside: Remember that ENCs can only perform a subset of what you
can do with your site.pp manifest. Effectively, you can use an ENC to declare
classes and assign variables. If you've done a good job of generalizing your
configurations into classes and modules then this will not present a problem for
you.] When you use the Console to add parameters and classes to a node, these
are presented to Puppet via a command line ENC that run against the same
database. When you install Puppet Enterprise, it is already configured with this
ENC.

One thing that's not clear, even among old time puppeteers, is how the ENC
interacts with local node definitions coming from the site.pp manifest on the
puppet master. To be fair, this was not entirely consistent in the past. For a
time, if the ENC returned a definition for a node, then the definitions in
site.pp were not even looked at. Except for the default node, that is. Oh, and a
few other corner cases.

But none of that matters now, because Puppet is awesome enough to merge
definitions from both the ENC and the definition from your manifests! Now why is
this useful?

## Case study:

Jason is a sysadmin at Wonky Widgets Incorporated. The sysadmin role has
canonical control over all their systems. They have exclusive access to the
Puppet configuration, including the manifests. They manage the base
configuration and security updates for all systems that Wonky Widgets operate.

Wonky Widgets also has several separate teams that are responsible for different
segments of their infrastructure. The Web Development team manages their own
workstations and web servers, which are distinct from the public facing web
servers which are managed by the Infrastructure team, and the Database team
manages their database servers. In the interest of being as agile as possible,
these teams don't want to have to wait for the sysadmins to write Puppet
manifests for them when making configurations updates. Conversely, the sysadmins
don't want to depend on each team to manage security updates for their products,
as they don't necessarily have someone on call at all hours for incident
response.

They could work with these constraints by simply including a manifest from each
team which defines all of that team's nodes as in:

``` puppet
#/etc/puppetlabs/puppet/manifests/site.pp

[… global configuration...]

import 'webdev'   # webdev.pp, managed by the webdev team
import 'database' # database.pp, managed by the database team
```

but this has the unintended side effect that a syntax error in either of these
files breaks catalog compilation for each and every node. This is a Very Bad
Thing™. A better solution may be for the sysadmins to manage the classes and
modules and base configuration for all nodes. Each team could then assign
classes and parameters to the nodes they manage using the Console.

How would this work?

Jason defines classes for the resources that his teams need. He uses parameters
to customize the resources as needed. For example, he could define the `motd`
class in an `motd` module and then include this module in the global section of
the `site.pp` manifest. This would apply it to all nodes on the network:

``` puppet
#/etc/puppetlabs/puppet/modules/motd/manifests/init.pp

class motd {
    file { '/etc/motd':
        ensure  => file,
        owner   => 'root',
        group   => 'root',
        mode    => '0644',
        content => template('motd/motd.erb'),
    }
}
```

He then defines the template to include the company required boilerplate, plus a
message that can be defined via a parameter in the console. Each team can then
include a message saying anything they like. Notice that Jason checked for the
existence of the message parameter before using it.

``` ruby
<%# /etc/puppetlabs/puppet/modules/motd/templates/motd.erb %>
Welcome to <%= fqdn -%>.

This is a server owned and operated by Wonky Widgets Incorporated
and is running <%= operatingsystem %> <%= operatingsystemrelease %>.

<% if @message %><%= @message %><% end %>

WARNING:- YOU MUST HAVE PRIOR AUTHORIZATION TO ACCESS THIS SYSTEM.
ALL CONNECTIONS ARE LOGGED AND MONITORED. BY CONNECTING TO THIS
SYSTEM YOU FULLY CONSENT TO ALL MONITORING. UN-AUTHORIZED ACCESS
OR USE WILL BE PROSECUTED TO THE FULL EXTENT OF LAW.
```

Jason also writes modules to install and configure Apache, MongoDB, SpamAssasin,
phpMyAdmin, and many other packages that are deployed on various nodes across
the network. Each team chooses which modules they'd like on their servers by
adding classes to their nodes and they will be included alongside the
administratively included classes from the manifest.

Jason can configure the infrastructure, both globally and at the individual node
level, and also give each team the ability to configure their systems without
sharing write access to the Puppet manifests. Better ways of defining this
privilege separation are coming, but this is a quick and easy way to accomplish
this today.

You can certainly make the argument (and some have) that using this feature is a
sign of a poorly segmented infrastructure, but like they say, configurations are
like armpits; everyone's got them and they all stink to one degree or another.
If your particular configuration can benefit from merging definitions then these
are some points you need to keep in mind:

* Every node definition originates from the ENC. If your ENC fails or returns a
  non-zero exit code, catalog compilation will fail and Puppet will yell loudly at
  you. Your ENC should return an empty node object if it has nothing to say.
* Classes, resources, and parameters from the site.pp manifest are also added to
  the catalog, including those specified globally (outside the node definition)
  and those within the most specific node definition.
* Classes and parameters from the ENC are added at top scope, and normal scoping
  rules are followed. There is no concept of precedence. This means that if you
  duplicate a parameter as a global variable in your manifest, compilation will
  fail with a reassignment error. If you assign a variable within your node
  definition then it is considered to be a local variable in your class or module.
* If you have at least one node definition in your manifest, then you must have
  a definition for every node, or compilation will fail. If you don't need
  definitions for all your nodes in your manifest, simply add an empty default
  node definition.

Before implementing your infrastructure in this way, please keep in mind that
you are breaking the Single Source of Truth design practice. Instead of having a
single canonical source for your configuration data, you will now need to look
in two places and understand the interactions between the two. You should
investigate alternate methods, perhaps by starting at [this blog post](http://puppetlabs.com/blog/the-problem-with-separating-data-from-puppet-code/).

More information can be found in the [External Node guide](http://docs.puppetlabs.com/guides/external_nodes.html).
