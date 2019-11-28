---
layout: post
title: "So what is this Puppet thing anyway?"
summary: Getting started with the Puppet language.
image: puppet_zero.png
category: zero
tags: [puppet, "system administration", tutorials, introduction, "configuration management", configuration]
---
So you keep hearing about this Puppet thing and how it's going to solve all of
your DevOpsy configuration management problems. But what is it? How do you write
a Puppet script? Well, as it turns out, the key concept is unlearning the habit
of thinking about `scripts`. But all in good time. We'll get there. First, let's
write some code.

Let's start out with something easy. You all know what the `/etc/motd` file is.
It's the message of the day file that's dumped to your screen every time you log
in.

It's usually got [goofy cowsay ASCII art](http://cowsay.morecode.org/say?message=Puppet%20is%20way%20cool&format=html),
or some scary warning designed to make you wet your pants a bit before getting any work done.

It might look something like this:

```
         _   _           _              _ _
        | | | |_ __ ___ | |__  _ __ ___| | | __ _
        | | | | '_ ` _ \| '_ \| '__/ _ \ | |/ _` |
        | |_| | | | | | | |_) | | |  __/ | | (_| |
     ____\___/|_| |_| |_|_.__/|_|  \___|_|_|\__,_|
    / ___|___  _ __ _ __   ___  _ __ __ _| |_(_) ___  _ __
   | |   / _ \| '__| '_ \ / _ \| '__/ _` | __| |/ _ \| '_ \
   | |__| (_) | |  | |_) | (_) | | | (_| | |_| | (_) | | | |
    \____\___/|_|  | .__/ \___/|_|  \__,_|\__|_|\___/|_| |_|
                   |_|
                             NOTICE TO USERS

This computer is the property of the Umbrella Corporation. It is for authorized
use only. Users (authorized or unauthorized) have no explicit or implicit
expectation of privacy.

Any or all uses of this system and all files on this system may be intercepted,
monitored, recorded, copied, audited, inspected, and disclosed to authorized
site, your mother, and law enforcement personnel, as well as authorized
officials of other agencies, both domestic and foreign.  By using this system,
the user consents to such interception, monitoring, recording, copying,
auditing, inspection, and disclosure at the discretion of authorized site or
Umbrella Corporation personnel.

Unauthorized or improper use of this system may result in administrative
disciplinary action and civil and criminal penalties.  By continuing to use this
system you indicate your awareness of and consent to these term and conditions
of use.

LOG OFF IMMEDIATELY if you do not agree to the conditions stated in this warning.

Umbrella Corporation policy and rules for computing, including appropriate use,
may be found at http://www.umbrella.com/users/cpolicy.html.
```

How are you configuring your `/etc/motd` message right now? Is it an echo
statement in your kickstart? Lets foray into the world of configuration
management by learning how to do it with Puppet.

First we'll write a manifest:

``` puppet
# motd.pp
file { '/etc/motd':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => "Whee! Puppet is fun!\n",
}
```

This is what we call a *resource declaration*. A resource is just something that
Puppet knows how to manage. Puppet knows how to work with files, users,
packages, cron jobs, Windows registry entries, and all sorts of other things out
of the box. You can install more resource types as modules, too.

When we say *manage*, what we mean is that Puppet can take a description of what
you want that resource to look like and perform any operations required to
enforce that state. In other words, resources are managed in terms of
*attributes*. When you apply the example above, Puppet will ensure that the *file
resource* named `/etc/motd` will be a file. It will ensure that the `owner` and
`group` will be set to `root` and the `mode`, or [Unix permissions](https://en.wikipedia.org/wiki/File_system_permissions#Numeric_notation),
will be set to `0644`. Finally, the file's content will be set to the string we specified.

But enough talk, let's enforce it. Make sure to use `sudo` if you need to escalate to root privileges.

```
[532:ben@ganymede] code $ sudo puppet apply motd.pp
Notice: Compiled catalog for ganymede.corp.puppetlabs.net in environment production in 0.37 seconds
Notice: /Stage[main]/Main/File[/etc/motd]/ensure: defined content as '{md5}a0d35b13301c8d834e8a49197fbd1d03'
Notice: Finished catalog run in 0.07 seconds
[533:ben@ganymede] code $
```

What just happened? Puppet looked at the description you provided and made the
state on disk match it. Let's try that again.

```
[533:ben@ganymede] code $ sudo puppet apply motd.pp
Notice: Compiled catalog for ganymede.corp.puppetlabs.net in environment production in 0.46 seconds
Notice: Finished catalog run in 0.06 seconds
[534:ben@ganymede] code $
```

Wait, what? Is something broken? Why didn't Puppet do anything that time?

Actually, it did. It did the same thing. However, the state on disk already
matched the description you provided! Puppet ~~is as lazy as the rest of us~~ works
efficiently and won't do something if it doesn't need to. It will simply check
what's on disk and make sure it matches what's requested.

> Use Puppet to describe expected state, rather than writing a script of actions to perform.

This is a concept called *idempotence*, and I'll come back to it in a later
post. For today, the lesson you've learned is that you use the Puppet language
to describe what you want a computer to look like, and then you let Puppet
figure out how to enforce it.
