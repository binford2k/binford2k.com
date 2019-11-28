---
layout: post
title: "Idempotence -- not just a big & scary word"
summary: "Already did it; not gonna do it again!"
image: idempotence.jpg
category: zero
tags: ["configuration management", puppet, math]
---
You may have read some docs, or stopped by the [`#puppet`](irc://irc.freenode.net/#puppet)
IRC channel. You've likely read a blog post or two. You've probably run across
the word *idempotence* or have been chastised for writing non-idempotent Puppet
code with exec resources. But what exactly does that mean? Here's a definition
that you might see in a calculus class.

> ##### i·dem·po·tent
>
> *īdemˈpōt(ə)nt,ˈēdemˌpōt(ə)nt/*
>
> denoting an element of a set that is unchanged in value when multiplied or otherwise operated on by itself.

Well, there's that. We can all go home now; question answered.

Actually no. How about we talk about it in English words? Idempotence is simply
a word that describes an operation that will have the same effect whether you
run it once or 10,001 times. Adding one **is not idempotent** because the result
keeps incrementing, but multiplying by one **is idempotent** because the answer is
the same no matter how many times you multiply it!

Well, that's still math. How about a more concrete example. Imagine a time when
you were 12 and your mom asked you to take out the trash. Being the good kid you
were, you dropped the GameBoy and jumped right up to do as you were asked, yeah?

But then 30 minutes later when she walked back through the living room and saw
you curled up on the couch playing *Super Mario Land*, she told you again to take
out the trash. I strongly suspect that you did not leap up to go take out an
empty trash bag.

Instead you said, "already did it, Mom!" That's idempotence. The effect of being
told once to take the trash out is the same as the effect of being told twice.
You didn't do it again because it had already been done.

Coincidentally, this is exactly how Puppet works. Every time the Agent runs, it
has the same set of instructions captured in a catalog. These instructions tell
Puppet the state it should manage, and might look something like this:

``` puppet
user { 'Administrator':
    ensure => present,
    groups => ['Administrators'],
 }

# useful tools
package { ['console2', 'putty', 'notepadplusplus']:
    ensure   => present,
    provider => 'chocolatey',
}

# Symlink on the user desktop
file { 'C:/Users/Administrator/Desktop/puppet_confdir':
    ensure => link,
    target => $classroom::confdir,
}
```

This tells Puppet to make sure that a certain user exists and is a member of the
right group. It makes sure some packages are properly installed, and that
there's a symlink on the user's desktop. Notice that I didn't describe it as
instructing Puppet to **install** packages. It does not say that at all. It says to
make sure they are installed. This means that if the packages are not installed
that Puppet will install them, but if they're already installed it won't try to
install it again.

Quite a useful concept, no? This is what allows Puppet to run periodically and
verify that the system is configured properly. If the node is accidentally
changed to take it out of compliance, then Puppet will converge it back into
compliance. If you update the instructions in your manifests, then Puppet will
update the node's configuration to match. If disaster strikes and you need
another machine exactly like this one to replace it, you can simply apply the
same configuration to the new machine via classification, which we'll cover
another day.

So how about that time you were chastised for writing non-idempotent execs?
People new to Puppet generally have shell scripts they're replacing, and they
write code that looks sort of like this:

``` puppet
exec { '/usr/bin/curl http: //server.net/packages/package.tar.gz -o /tmp/package.tar.gz ': }

-> exec { 'tar -xf /tmp/package.tar.gz -C /tmp/package': }

-> exec { '/tmp/package/installer.sh': }

file { '/tmp/package':
    ensure  => absent,
    force   => true,
    require => Exec[ '/tmp/package/installer.sh'],
}

file { '/tmp/package.tar.gz':
    ensure  => absent,
    force   => true,
    require => Exec[ '/tmp/package/installer.sh'],
}
```

So what's wrong with that? It works, right? Download the tarball, extract it,
install the thing, then clean up after yourself. It looks like it should run
perfectly, assuming no typos or network issues. And it will.

But it will run perfectly **every time** Puppet runs.

In other words, it will download and run the installer script every thirty
minutes! A much more robust pattern takes advantage of the idempotence
attributes that the exec resource type offers.

``` puppet
exec { 'install-chocolatey':
    command  => 'iex ((new-object net.webclient).DownloadString("https: //chocolatey.org/install.ps1")) >$null 2>&1',
    creates  => ['C:\Chocolatey','C:\ProgramData\chocolatey'],
    provider => powershell,
    timeout  => $classroom::params::timeout,
}
```

This resource description tells Puppet the files that will be created,
`['C:\Chocolatey','C:\ProgramData\chocolatey']`. If they already exist, then
Puppet assumes that the command has run successfully and won't attempt to invoke
it again. Much better.

An even better pattern would be to package the installer as a system
package--RPM or DEB or the like. Then you can just use the built in `package` type
to manage it, including upgrades and removal. This is much easier than you think
using something like Jordan Sissel's most excellent [fpm](https://github.com/jordansissel/fpm)
tool. That reduces our nasty Puppet-as-a-fancy-shell-script-engine code above to something like:

``` puppet
package { 'my-package':
    ensure => present,
}
```

Now that's progress.

