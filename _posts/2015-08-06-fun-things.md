---
layout: post
title: "Oh, the fun things we can write!"
image: boring-book-cover.jpg
category: zero
tags: [puppet, "system administration", tutorials, introduction, "configuration management", configuration]
---
So now we've used Puppet to manage a file on our computer. The `/etc/motd` file is
now owned by `root` and has a fun little sentence in it. We can write all we want
out to that file. But sooner or later, we're going to want to put something a
little more interesting. Perhaps we'll want the hostname or operating system
installed?

We'll take a little side trip first, though, and learn about `$variables`.

A variable is a [symbolic name that contains some value](https://en.wikipedia.org/wiki/Variable_(computer_science)),
such as a string, like "Hi Mom!," or a number, like 42. It is called a variable
not because it changes, but because we can choose any value we want to store in
the variable. As a matter of fact, in the Puppet language, once a variable has
been set, it is not allowed to be changed during the rest of that run. They can
more accurately be called constants--another computer sciencey term which simply
means a variable that doesn't change!

Let's try that out.

``` puppet
$message = "Hi Mom! I am learning about Puppet and it's fun."

notify { $message: }
```

A `notify` resource is typically how we output messages during the Puppet run. It
will simply display the message used as its `title` to the console.

```
[509:ben@ganymede] code $ puppet apply message.pp
Notice: Compiled catalog for ganymede.local in environment production in 0.02 seconds
Notice: Hi Mom! I am learning about Puppet and it's fun.
Notice: /Stage[main]/Main/Notify[Hi Mom! I am learning about Puppet and it's fun.]/message: defined 'message' as 'Hi Mom! I am learning about Puppet and it's fun.'
Notice: Finished catalog run in 0.10 seconds
```

Here, we stored a value (the string "Hi Mom! I am learning about Puppet and it's
fun.") into a variable named `$message`, and then referred to that variable
later on in the code. Let's try that with our `motd.pp` file from the earlier
post.

``` puppet
$content = "Whee, Puppet is fun!

I am learning all kinds of very cool things now.
"

file { '/etc/motd':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => $content,
}
```

This time we stored a multiple line value into our variable. Notice that on line
#11, we passed the variable directly to the content parameter. As the Puppet run
proceeds, the symbolic variable is replaced with its value.

That's handy, but writing out the full file into a variable is not really much
of an improvement. How do we accommodate for slight variations? We certainly
don't want to cut & paste and make tiny modifications. Let's learn how to embed
a variable into a string. That will be handy.

Edit the top of the source file, or manifest, to look like this:

``` puppet
$name    = " Your name goes here"
$content = "Whee, Puppet is fun!

I am learning all kinds of very cool things now.
  Administered by: ${name}
"
```

Now when you apply your manifest, the `/etc/motd` file will have your name
embedded in it. Notice the curly {} braces on the highlighted line? That's how
we tell Puppet unambiguously which part of the string is your variable and which
is not.

> It's worth pointing out that string interpolation, such as
> `$message = "This contains another ${variable} embedded within itself."`
> should use the curly {} braces around the variable name, but this is a
> syntax error when used outside a string!

Now are you ready for something really cool? I thought so.

Puppet makes a whole list of magic variables containing all sorts of information
about the machine you're running on--things like the hostname or other network
information, or what operating system is running. They're available for you to
use in any manifest any time you like. You can simply trust that they'll be set
and Puppet will determine their values automatically. These are called `facts` and
you can inspect them by running `facter` on your Puppet VM.

```
[510:ben@ganymede] code $ facter
augeas => {
  version => "1.4.0"
}
disks => {
  sda => {
    model => "VMware Virtual S",
    size => "20.00 GiB",
    size_bytes => 21474836480,
    vendor => "VMware,"
  }
}
dmi => {
  bios => {
    release_date => "05/20/2014",
    vendor => "Phoenix Technologies LTD",
    version => "6.00"
  },
...
```

Well, that was quite the data dump! Lets narrow it down a bit:

```
[511:ben@ganymede] code $ facter osfamily
Redhat
[512:ben@ganymede] code $ facter kernel
Linux
[513:ben@ganymede] code $ facter uptime
22:35 hours
```

Well, that's pretty useful. Let's try including some of these facts into our
`/etc/motd` file. Update your manifest to look like this:

``` puppet
$content = "Welcome to ${fqdn}

  This machine has been running ${osfamily}
on a ${kernel}-${kernelrelease} platform
        for ${uptime}.
"

file { '/etc/motd':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => $content,
}
```

Now we'll run it and see what our results are.

```
[514:ben@ganymede] code $ sudo puppet apply test.pp
Notice: Compiled catalog for ganymede.puppetlabs.vm in environment production in 0.28 seconds
Notice: /Stage[main]/Main/File[/etc/motd]/ensure: defined content as '{md5}958237052eb198ed69008e6266c84601'
Notice: Applied catalog in 0.17 seconds
[515:ben@ganymede] code $ cat /etc/motd
Welcome to ganymede.puppetlabs.vm

  This machine has been running RedHat
on a Linux-2.6.32-504.el6.x86_64 platform
        for 22:37 hours.
```

Now that's getting darn right useful.
