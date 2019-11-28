---
layout: post
title: "Manipulating existing state, and other foolish ideas"
summary: "Remember that flexibility is not always a benefit; a bowl of spaghetti is also rather flexible."
image:
category:
tags: ["system administration", puppet, "configuration management"]
---
One of the more common questions I'm asked on [`#puppet`](irc://freenode.net/puppet)
is how to use existing state when applying configuration to a node. For example,
"how can I tell when mysql is installed, so I can add a firewall rule for it?"
In this post, I'm going to talk a little bit about why I think there's such a
draw to this approach, then I'll explain why it's universally such a bad idea,
and then I'll talk about better ways of accomplishing the same goals.

There are two main reasons why people want to work with existing state. The
first is when a configuration file exists in a relatively known static state and
someone gets the idea that "I don't want anything complex, all I want to do is
mutate one line!" For example, one can run something like this to disable root
SSH logins:

``` shell
sed -i "s/^PermitRootLogin yes$/PermitRootLogin no/" /etc/ssh/sshd_config
```

Now the seasoned sysadmins can already see about twelve ways this can go wrong.
It's dependent on an exact string that we're replacing so if that string changes
for some reason then the rule won't have any effect at all. Maybe the
`PermitRootLogin` line is commented out, or there's an extra space between the
words, for example. So let's fix that with a more permissive regex.

``` shell
sed -i "s/^.*PermitRootLogin.*$/PermitRootLogin no/" /etc/ssh/sshd_config
```

Now no matter how it's commented or how it's spaced, we'll replace the line with
our desired setting. Of course, it will also trash any comments that happen to
contain that string too, so a comment like this would be destroyed, removing
valuable context, and duplicate settings would be written into the config file.

```
# Don't forget, we set PermitRootLogin to no on all the front line servers!
PermitRootLogin no
```

Sure, you can argue that you could write a regex that truly matched (and it
really wouldn't be hard), or you can say that it doesn't matter because you know
what the starting state of that file is going to be, so you know that it won't
have any weird edge cases. But that's dodging the real issues here:

1. You shouldn't have to write and audit ridiculous and unreadable regular
   expressions to configure a node.
1. You shouldn't have to audit each and every new configuration file update to
   ensure that the project or your distribution didn't change the defaults or
   the stylistic formatting of the file.
1. And most importantly, sed errors are usually silent.

I'll say that again.

> Editing files in-place with sed one-liners is error prone in the worst way possible.

If your regex doesn't match, sed won't scream at you for writing a bad regex. It
will just go on its way happily doing nothing at all and leaving you in some
unknown state--an unavailable service at best, but more often a silent security
vulnerability.

> ### Rule 1:
> The only reason that quick inline sed edits are simple is because you're
> ignoring all the ways that it will go wrong and make you hate your life.

The second reason for manipulating existing state is that the sysadmin is put
into the unfortunate role of somehow maintaining a reasonable configuration on a
node after a dev team2 has custom tweaked it to make their application run. Or
come close to running.

In that case, I'm afraid that all I can say is that no technology can fix a
broken process. The best way to improve reliability and predictability is to
reduce variation. If the input to your configuration management process is
infinitely large then the output is by definition also infinite and untestable.
Each input variation exponentially increases the number of potential outputs.

What's worse is that the final configuration of your node ends up being some
mishmash of it's existing configuration and the configuration manifests you
write. That means that it is explicitly **not repeatable**. This means that if a
cosmic ray fried the SSD of that server and you had to rebuild it, that you
could not. It would be impossible for you to do so. In order to get a
replacement server configured similarly, you must start with the the node
configured exactly as the earlier one was. In other words, the dev team would
have to fiddle until they got something workable again... and then if you were
lucky it might be close and you don't have to spend 4 hours of expensive
downtime with your boss breathing down your neck figuring out that you need to
bump your app's heap size because someone forgot to document that little nugget.

> ### Rule 2:
> If your process relies on everyone doing everything exactly correctly, then
> you're setting yourself up to fail. Instead, your process should prevent mistakes.

## Please sir, make it better!

To make a repeatable configuration, we need to control the flow of information.
We need to accept a given number of inputs, use that to build a complete
configuration state, and finally apply that to a node. This means that we have
recorded exactly what is needed to make the system work. It means that we've
documented the inputs we can work with and their acceptable values.

Never take a machine that your dev team has configured and installed application(s) on.

> ### Rule 3:
> When you provision a new system, you should spin up a squeaky clean brand new
> instance and apply your configuration model from scratch. If it doesn't result
> in a workable system, then you are not fully managing everything you need to be
> managing.

Your end users requesting the nodes should have a defined interface through
which they can configure the node. For example, instead of fiddling with the
`httpd.conf` file, or `sysctl.conf` they should have a limited number of options
to pass to your configuration system. For example, you might have a profile
class that accepts parameters like:

``` puppet
class { 'tomcat_application':
  heap         => '512m',
  java_version => '1.6',
  docroot      => '/home/tomcat/apps/release/stable/employee_portal',
}
```

When your end users come to you up in arms because they need to configure
something that's not handled by your profile. They will insist that they need
root access to the machine so that they can configure it and get their jobs
done. You must politely refuse. Instead, work with them to define the
configuration parameters required and to design those into your profile classes.

> ### Rule 4:
> Never give admin access to your managed nodes. Instead treat configuration as
> an API and provide appropriate parameters to your end users. All configuration
> should go through the well defined interface of your configuration management
> system.

With this well defined configuration model you've reduced your support profile
drastically. When something goes wrong, instead of starting your debugging
process from step 0 *every single time*, you can make reasonable assumptions about
the configuration. Not only that, but that you can trace the decision tree used
to build that configuration.

For example, I debugged a classroom problem today in which the classroom Puppet
Master suddenly stopped serving valid configurations with error messges
indicating that classes were not found.

After some troubleshooting, we came to the realization that
`/etc/puppetlabe/puppet/modules` was a symlink rather than a directory. Regardless
of any other symptoms, this bit of information told me exactly what had happened
and the debugging process was done.

We had some code that looked like:

``` puppet
if $::hostname == 'master' {
# define a list of classes that should be available in the console
  class { 'fundamentals::master':
    classes => [ 'users', 'apache', 'fundamentals' ]
  }
}
else {
  include fundamentals::agent
}
```

And in the `fundamentals::agent` class, the following code actually managed that symlink:

``` puppet
file { '/etc/puppetlabs/puppet/modules':
  ensure => link,
  target => "/root/${workdir}/modules",
  force  => true,
}
```

This meant that the only way the directory could have been replaced with a
symlink would have been for the hostname to have been set incorrectly at some
point. Troubleshooting done. We rebuilt the modulepath  and were back in
business. The post-mortem came later, of course.

> ### Rule 5:
> When you have a well defined set of configuration options, the set of
> resulting problems that can occur drops from infinity to some more manageable
> number.

No matter what your situation, you should be striving for simplicity and for
reducing your support profile. This will allow you to make reasonable
assumptions about the configuration and will shortcut debugging, providing you a
shorter time to resolution.

Remember that flexibility is not always a benefit; a bowl of spaghetti is also rather flexible.
