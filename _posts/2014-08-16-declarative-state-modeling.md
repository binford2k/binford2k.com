---
layout: post
title: "Declarative State Modeling"
summary: Describe the end result and let Puppet worry about the implementation details.
tags: ["system administration", puppet, "configuration management"]
---
By now in your Puppet career, you've almost certainly been exposed to the
phrases *declarative state* or *state modeling*. You may even have a pretty good
idea of what the words mean. But how in the dickens do they relate to
**configuration management**? The confusion only makes sense. We've been writing
shell scripts to provision, configure, and even boot our computer systems for
forty years. It's going to take a mighty strong argument to change that habit
now.

I hope this post can make that argument for you, because being set free of
procedural implementation details is exhilarating.

To separate ourselves from any preconceived notions, lets talk about something
as far unrelated from configuration management as we can. My father is a fairly
accomplished painter. He works in oil and paints mostly natural settings;
wildlife, mountains and streams, old barns. In my living room, I have a
beautiful snarling cougar he painted for me after the school mascot of my *alma
mater*.

## The ordering elephant in the room

![Hello? I'd like to order a pizza.]({{ site.baseurl }}/assets/images/elephant_0.jpg){:.leftside}

There is a certain process to working in oil. First you must wash the background
of the painting with any base colors you are using. You'll need to lay down only
the darker colors of your background first, so often this is just a complex
gradient. Perhaps you'll choose a few shades of black, blue, and purple to
provide the backdrop for the evening sky. Next, you must let that layer dry, so
when you go over it with another shade the colors will stay separate instead of
blending into a muddy brown. Then you cover the entire painting with the next
layer, which might be the highlights of that stunning sunset in the background
behind the subject of your masterpiece.

This process goes on for many days, even weeks or months, which is the reason
I'm not an oil painter. I've got no patience for that!

After many iterations of drying layers, we finally come to the foreground of our
imaginary painting. Lets say that there's a stream with a handful of stones
breaking the water and a copse of maple trees nearby. Clearly, the rushing water
must be painted after the stones as the water will be covering them, but which
stone should you paint first? The one on the left or the one on the right? The
one upstream or the one downstream? What about the trees?

The key here is that it *doesn't matter*. There is a relationship between the
water and each stone, but it really doesn't matter which stone you paint first.
Simply paint them in any arbitrary order that happens to be convenient to you.

``` puppet
class stream {
  object { 'riverbed':
    before => Object['stone one', 'stone two', 'stone three'],
  }
  # It doesn't really matter what order these go in
  object { ['stone one', 'stone two', 'stone three']:
    before => Object['water'],
  }
  object { 'water':
  }
  # The trees can be painted at any time.
  object { 'trees':
    count => 7,
  }
}
```

Puppet works much in the same way. When you are provisioning a new server, you
usually have a handful of things you'll need to do first. Maybe you'll need to
configure a local yum repository so that any packages that get installed come
from your own personally vetted packages rather than the upstream repo. But it
doesn't really matter whether the `oracle` user gets created before the ProFTPd
service gets started. (Does anyone still use FTP? I jest, I jest.) And it
doesn't really matter when the `logrotate` parameters are tuned either.

Simply describe the things that you need Puppet to configure and provide
ordering hints only when needed. In that way, Puppet knows that the ProFTPd
server we started up there should actually be installed first, but it knows that
it doesn't have to be concerned with other ordering details.

## Why does that matter?

You are a good sysadmin, so you're familiar with these three tenets of the Unix
philosophy, [the Rule of Modularity, the Rule of Composition, and the Rule of
Separation](http://www.faqs.org/docs/artu/ch01s06.html). The `grep` tool does
one thing, and it does it really freaking well.  `cat` also does one thing, as
does `sed` and `tail`. You've written hundreds of shell scripts that chained
these tools together and combined them in interesting ways.  Let's apply those
same ideas to our configuration management. When we write a [module to manage
`sysctl`](http://forge.puppetlabs.com/fiddyspence/sysctl), the module should
manage `sysctl` and only `sysctl`. It doesn't write interesting aliases into
root's `.profile` to provide tweaking shortcuts *just because it can*.

Instead, we use the concept of composition. We take the [MySQL](http://forge.puppetlabs.com/puppetlabs/mysql)
module, and the [`sysctl` module](http://forge.puppetlabs.com/fiddyspence/sysctl),
and then we write our own little module that manages users and their login
scripts. Each of those simply gives us one unique component of our
configuration. Then we can define a database server as just a list of these
`classes` and `resources`. It doesn't really matter if the `mysql` package is
installed before `sysctl` is tuned, or before the `dbadmin` user is created.
Building up a new database node is now just a matter of assigning it a list of
classes.

What happens if you want this database node to also run the Nagios monitoring
agent? You guessed it! We simply write a `nagios` class and add it to the list.

### We've learned our first lesson on state modeling:

> Don't depend on artificial execution order. Simply describe your node as a
> list of the configuration classes you want applied to it.

## This is not a fancy shell script engine

Let's go back to our painting for a moment, and hope that it's all dry by now.
Imagine that your mother calls on the phone and asks what your creation looks
like. I'll bet your conversation goes a bit like this:

> You:
> > So first you start with a blank canvas and wash it with a charcoal color.
>
> Her:
> > What?
>
> You:
> > Yeah, and then you sketch in nine smears of this shade of orange up in the
> top right corner.
>
> Her:
> > What are you talking about?
>
> You:
> > And then get out the purple, because there's a bit of a smudge in between the orange.
>
> Her:
> > This is why I hate talking to you. I just wanted to know what you painted.
>
> You:
> > But I haven't even gotten to the blue-grey yet! It's a beautiful shade...

NO!

Nobody in their right mind talks like that. Instead you'd tell her, "Mom, it's
this really gorgeous sunset exploding over the horizon behind a serene mountain
stream burbling over some stones. Oh, and there's trees!"

She's not interested in the steps you took to create this painting. She's just
interested in the end result. (We'll assume for the purposes of this thought
exercise that she's not a fellow painter looking to geek out herself). That is
the sort of relationship we would like to have with the server nodes of our
infrastructure that we are managing with Puppet. *Dear Puppet: I don't care what
you do, or how you do it, but when you're done, it would be absolutely peachy if
my server looked like this*.

### Our second lesson on state modeling:

> Don't give Puppet a list of actions to complete. Instead, describe what the
> end result should be.

## Everything's about resource management

There are a handful of classic catchphrases in configuration management. The
most famous of which is "never get involved in a land war in Asia," but only
slightly less well-known is this: "Everything is about managing resources."

Puppet gives you the tools to manage resources on your systems. These resources
can be anything really. They are simply *the smallest unit of configuration that
Puppet knows how to deal with individually*. This unit of configuration might be
a software package, such as the `mysql-client` RPM. It might be the `dbadmin` user
we mentioned above. It might be a configuration file, like `/etc/motd`, or it
might be only a single line inside a file, like entries in `/etc/hosts`.

The key is that a resource is one singular thing that Puppet has control of.
This resource is managed in terms of `attributes`, which are simply properties of
that resource. For example, if we talk about your car, you might say that it has
attributes such as `color` or `number_of_wheels`. Further, you could say that the
`value` of the `color` attribute was `red` and we'd know that your insurance premium
will go up.

Notice that we don't say anything about HOW it was painted, or whether it was
painted before the wheels were bolted on or after, or what color it was before.
It may have been blue last month, or maybe red is the first color it was
painted. We don't particularly care. What we do care about is that your car has
four wheels and it's red.

## Focus on the result

We approach configuration management in much the same way. Instead of writing
actions to manipulate files on disk, or to perform tasks for us, we simply cut
to the chase and describe the state that we would like the result of our Puppet
configuration run to be. A `file` resource, for example, may be described in terms
of `content`, of `owner`, of permission `mode`, etc.

``` puppet
file { '/etc/motd':
  ensure  => file,
  owner   => 'root',
  group   => 'root',
  mode    => '0644',
  content => "This file is managed by Puppet and will always match the properties I define for it!",
}
```

So what happens if the file doesn't exist when we run Puppet? It will be created
with the attributes we've defined. What happens if someone changes the file
content? Puppet will change it back, because it doesn't match what we've
defined. What happens if the file already matches everything we've described it
to be? Nothing, but Puppet checks it anyway, just to make sure.

Each time Puppet runs, it will step through and inspect each resource in your
catalog. If you have ensured it present then Puppet will make sure it is there,
and if you have ensured it absent then Puppet will make sure that it is not. For
each of those resources Puppet will also check each of the attributes that
you've described. In the `File['/etc/motd']` example above, every time Puppet
runs, it will make sure that the file `/etc/motd` is owned by `root` and that it has
a permission `mode` of `0644`.

This means that you no longer care what the pre-existing state is. The machine
could be a newly provisioned EC2 instance with absolutely nothing configured, or
it could be a grizzled old beast who's been in service for months and has Seen.
Some. Stuff. No matter what the state going in to the Puppet run, the node comes
out of it configured the way your Puppet code describes.

### Our third lesson on state modeling:

> Don't manipulate files or resources on your servers. Describe the desired
> configuration as a list of resources and the attributes of those resources that
> you care about and manage them completely.

## When is a door not a door?

When it's ajar. But seriously, when you are declaring state, a resource is or is
not in a certain state. The declarative paradigm says that when a certain class
is applied to a node, it will always have the same predictable effect. Because
of that, one can read Puppet code and have a reasonable understanding of the
complete configuration of the system in question.

![The Mona Lisa]({{ site.baseurl }}/assets/images/Leonardo_da_Vinci_043-mod.jpg){:.rightside}

Let's return to the painting metaphor one last time. You may recognize this
painting; it is rather well known. Let's say that by some stroke of luck, it was
hanging in your living room. What color would her blouse be? Would it be red,
like your car, to match the decor of your living room? Would she be sporting a
bright pink Mohawk, just to be rad? Of course not! If it were, it would no
longer be The Mona Lisa. A thing either **is** or **is not** that thing, except
for a certain cat owned by some dude named Schrödinger.

It is foolhardy to attempt to configure a resource, such as a configuration file
conditionally based on other elements of the server. For example, when building
a database server like we did above, it's common to want to tweak `sysctl`
parameters and `iptables` firewall rules. The naive Puppet coder might attempt to
write a class that somehow queries the node for services that are running and
builds the rules required for those services. This is an extraordinarily fragile
anti-pattern and it breaks the self-documenting expectation of Puppet code. You
can no longer predict the effects of this class.

Instead, we work the other way. We'll choose to use a [`sysctl` module](http://forge.puppetlabs.com/fiddyspence/sysctl)
and an [`iptables` module](http://forge.puppetlabs.com/puppetlabs/iptables) that
expose other resource types that we can use to build a class that is completely
self contained and completely predictable. Remember that Rule of Composition?
Our class will contain our `mysql::server` declaration, any `sysctl` parameters
we need tuned for MySQL, and all `iptables` firewall rules our database
configuration requires.

``` puppet
class site::database {
  include mysql::server

  sysctl { 'stuff': }
  iptables { 'more stuff': }
}
```

A common metaphor that many of us in the Puppet community use is that of
[Lego blocks](http://sysadvent.blogspot.com/2012/12/day-13-configuration-management-as-legos.html).
You want your configuration to be composed of simple blocks of modular
configuration. You want a MySQL? Here's a MySQL block! You want a PostgreSQL
instead? Here's one of those! Your server configurations become just a giant
Lego model. If you've ever stepped on a block in the middle of the night, you
know how bulletproof they are. When you are describing your configuration as
simply modular lists of resources and attributes then your configuration can be
just as bulletproof.

### We've come to our final lesson on declarative state modeling:

> Don't write overly complex be-all, end-all scripts that react to unpredictable
> circumstances. Instead, write small, simple, testable and modular blocks of
> configuration that can be combined to build the complete configuration you need.

And that kind of sums it up. Don't worry about ordering except when it matters.
Describe the end result and let Puppet worry about the implementation details.
Manage the resources you care about and manage them completely. Don't try to
invent clever schemes to manipulate existing resources. And finally, channel
your inner [@finch](http://www.twitter.com/nullfinch) and write modular Lego code.

