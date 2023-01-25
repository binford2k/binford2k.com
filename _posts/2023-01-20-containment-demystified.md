---
layout: post
title: "Puppet Containment Demystified"
summary: "Anchors, containment, graphs, oh my. For years, containment has been a mystical art and many modules either under-contain or over-contain, both of which can lead to surprising and unexpected runtime failures. Read this post to find out what's going on behind the scenes and better understand how to contain effectively."
image: containment/hobbitses.jpeg
category:
tags: [puppet, containment, development, modules, language]
---

Containment has always been kind of a sticky subject in the Puppet world. Part of
the confusion is that that Puppet tries really hard to handle on its own so that
you *don't have to care* about the weird little implementation details of how
ordering relationships are resolved.

But that just means you're not expecting it when it does raise its nasty little hobbit head.

Let's talk a bit about how containment works so that you're not surprised by an
unexpected production outage caused by an unforeseen dependency issue.

We'll start with ordering and the DAG. Directed Acyclic Graph is a scary sounding
phrase, but it's far less complex than it sounds. It's basically the same as those
"[draw this shape without lifting your pencil](https://www.transum.org/Maths/Activity/without/)"
games (for the graph nerds: swap the nodes and the edges.) Effectively, all it means
for an end user is that Puppet can only do one thing at a time, so no matter how many
resources or relationships you add to your Puppet code, it has to be able to resolve
those into a linear list of configuration specifications to enforce. It walks the
graph of resources to generate this list.

Usually you don't care about order. If you have 27 files to write and 19 users to
create they can almost certainly be done in arbitrary order. But sometimes it does
matter. For example, if you have a package to install, a configuration file to write,
and a service to start, then they normally have to be done in that order. It doesn't
make sense to start a service before it's been installed or configured.

These relationships are generally represented like such:

```
Package['foo'] -> File['/etc/foo.cfg'] ~> Service['foo']
```

Now, and this is where containment comes in, often these then become part of larger
dependencies. For example, if you're creating a MySQL user, database, or table,
then *all* of those MysQL related resources have to be enforced first. For this
to work reasonably, Puppet *contains* resources in the class they're declared in so
that relationships like this work.

```
Class['mysql'] -> Mysql_user['rob']
```

You can see these relationships resolved by [loading the validator](https://validate.puppet.com/load/https://gist.github.com/binford2k/3008e848612a9bd1ada8f2be909ea143)
and pressing the `Show relationships` button.

<img style="margin: 0 auto; display: block; border: none; width: 400px;" src="/assets/images/containment/one.svg" />

This makes relationships both super useful -- and also nearly transparent. They
Just Work™️. But what if the `mysql` was defined as a couple of sub classes?
Let's take a slight diversion for a moment and come back to this.

Puppet also has the concept of `idempotence`, also a [big and scary word](/zero/2015/10/17/idempotence/).
Basically, all it means is that if you assert something multiple times, then it should
have the same effect as doing it once. If that behaviour cannot be guaranteed, then
Puppet only allows it to be used once. (This, by the way, is one of the reasons that
many auditors will accept Puppet code as proof of compliance. The state described
in the Puppet code is the state enforced on the node without confusing layers of
potentially indeterminate overrides.)

This is often useful when including classes in your catalog. Let's say that your
security team has developed a `baseline_security_profile` class that ensures that
remote login is disabled, insecure services are disabled, kernel parameters are
tuned to prevent fork bombs, etc. They'd like you to ensure that it's enforced on
**ALL SERVERS**. One way to do that is to just include it in all of your profiles.
The `include` function works like `require` in Ruby or `include_once` in PHP. It
will evaluate and include the class only if it's not already been included.

```
class profile::mysql {
  include baseline_security_profile
  include mysql::server
}

class profile::apache {
  include baseline_security_profile # won't be re-evaluated
  include apache
  apache::vhost { 'robstestapp.example.com':
    port    => 80,
    docroot => '/var/www/robstestapp',
  }
}
```

This is great. You can declare either of these profile classes on a node and it
works. You can declare both of the classes on a node and it still *just works*.

Ah! But we've neglected to define the profile for Rob's test app itself. One
wrinkle is that *it creates a mysql user* when it's enforced. Let's take a look
at that class now:

```
class profile::rob::testapp {
  include baseline_security_profile # the security team wants this on all services!
  include profile::mysql

  mysql_user{ 'rob': }
  mysql::db { 'robstestapp':
    user     => 'rob',
    password => 'robisrad',
    host     => 'localhost',
    grant    => ['SELECT', 'UPDATE'],
  }

  include robstestapp
}
```

The neat thing is that Puppet is smart enough that this will almost certainly
*just work* again. But now, pop quiz time, keeping in mind three things we mentioned
above:
- Things in Puppet can only be declared once to ensure that when you look at a bit
  of Puppet code enforced on a machine you are certain that it's a true
  representation of the state of that node.
- Resources in a class are *contained* in a class so you can make relationships on
  that class and expect that things it declares follow those relationship specifications.
- The `include` function only includes a class if it's not already included.

Does the `baseline_security_profile` class included in `profile::mysql` get enforced
before or after the `baseline_security_profile` class included in the `profile::rob::testapp`
class?


## It's a trick question, of course.

The answer is that to meet all of those conditions, **classes included or declared
in other classes are not contained the way resources are!** They actually float off
in the dependency graph with no relationships to them unless explicitly provided.

Take a look at the relationships resolved by [loading the validator](https://validate.puppet.com/load/https://gist.github.com/binford2k/84e020389afe44b083e53a50aa47ce5a)
and pressing the `Show relationships` button.

<img style="margin: 0 auto; display: block; border: none; width: 600px;" src="/assets/images/containment/two.svg" />

You'll see that most of the classes on that graph are disconnected. They don't have
relationships to or from any other classes or resources. Puppet *explicitly excludes
classes* from the automatic containment that I described above, so only the class
with explicitly defined relationships has any relationships defined. It's impossible
to tell which order these resources will be applied in, and that's a good thing
because that's what lets us seamlessly include classes any time we know they're
going to be needed.

This means that if you're writing a class and you include another class, you should
be aware of whether ordering relationships expressed on your class should also apply
to the classes you include. If so, then you need to intentionally specify those
relationships by _containing_ the class yourself. This, of course, isn't magically
transitive. Any classes you contain should in turn contain any classes that they
require to to be ordered.


## Containment techniques

The original containment technique used a sneaky trick with `anchor` resources.
This pattern is mostly deprecated at this point, but it's useful to start there
because it makes the newer patterns much easier to understand.

Remember that we said that classes won't contain other classes, but they *will*
contain resources? And that you can specify ordering relationships on classes.
That means that if you put "bookend" style relationships between the class you
want to contain and other resources in a containing class, then you'd effectively
do the same thing as containment.

Look at the difference between these two graphs:

```
class container {
  user {['alison', 'tyrone']:
    ensure => present
  }
  include contained
}
```

<img style="margin: 0 auto; display: block; border: none; width: 600px;" src="/assets/images/containment/three.svg" />

[Load the validator](https://validate.puppet.com/load/https://gist.github.com/binford2k/f14be4b4e06471a6afa53f3425ea4d24)

and

```
class container {
  user {['alison', 'tyrone']:
    ensure => present
  }
  include contained
  User['alison'] -> Class['contained'] -> User['tyrone']
}
```

<img style="margin: 0 auto; display: block; border: none; width: 600px;" src="/assets/images/containment/four.svg" />

[Load the validator](https://validate.puppet.com/load/https://gist.github.com/binford2k/a4fff4cd29fab2176478f6c125f63ce4)

As you can see, adding those bookend relationships, `User['alison'] -> Class['contained'] -> User['tyrone']`,
effectively trapped or contained the other class and now you can expect relationships
on the container class to just work.

This requires you to have resources to bookend with, of course. You *could* use
`notify` resources, but that would add noise to your reports. It'd be nice if there
were resources that didn't actually do anything.....

Turns out, that's exactly what `anchor` resources are. They exist only to put a
node in the dependency graph that you can put resources on and have no other effect.
So you can write that class like so to get the same containment behaviour.

```
class container {
  anchor {['c_start', 'c_end']: }
  include contained
  Anchor['c_start'] -> Class['contained'] -> Anchor['c_end']
}
```

That's really it. Containment isn't as mystical as it sounds.

The new patterns use functions to achieve similar ordering properties. They don't
muddy up the graph with extra placeholder nodes, but they result in the same
behaviour to the end user.

```
class container {
  contain contained
}

## scaffolding for the validator
class contained {
  user {['alison', 'tyrone']:
    ensure => present
  }
}
include container
```

<img style="margin: 0 auto; display: block; border: none; width: 400px;" src="/assets/images/containment/five.svg" />

[Load the validator](https://validate.puppet.com/load/https://gist.github.com/binford2k/0d32bf607bebf1c3da7ab656785caeb8)

### Using the Puppet DSL to influence ordering

* `include`
  - Ensure that the named class is included.
  - Sets no ordering relationships.
* `require`
  - Ensure that the named class is included.
  - Also ensure that the named class is enforced *before* the current one.
* `contain`
  - Ensure that the named class is included.
  - Also ensure that the named class is *contained within* the current one.

Note that the `require` relationship will not transfer to classes included within
the named class, unless those classes are themselves also contained. Classes which
include other classes are always responsible for determining whether those classes
should be contained.


## Caveats

If it's this easy to contain a class, why not just contain all the time? Just
globally replace the `include` keyword with `contain`? Turns out that it's actually
not _just that easy_. The `include` function exists to get the "it doesn't matter
what order, just make sure this is in the catalog" behaviour.

Let's look at that `baseline_security_profile` example again, but port it to use
`contain` and `require`, whether or not they're needed.

```
class profile::mysql {
  contain baseline_security_profile
  # ...
}
class profile::apache {
  contain baseline_security_profile
  # ...
}
class profile::rob::testapp {
  contain baseline_security_profile # the security team wants this on all services!
  require profile::mysql
  require profile::apache
}
class baseline_security_profile{ }
include profile::rob::testapp
```

<img style="margin: 0 auto; display: block; border: none; width: 600px;" src="/assets/images/containment/six.svg" />

[Load the validator](https://validate.puppet.com/load/https://gist.github.com/binford2k/f7346d6147fb89e7e735cc2304f91477)

Look carefully at the graph and you'll see two loops, meaning that Puppet cannot
resolve it into a linear list of resources to configure. **This will cause Puppet
failures and no configuration will be enforced**.

There are two lessons to learn from this:
- Only contain classes which actually need to be ordered.
- Only contain classes that you own the lifecycle of.

For example, if that `baseline_security_profile` class performed some Yum or Apt
repository hardening, it's sensible that it should be enforced prior to any package
installation. It also makes sense for the security team to own the lifecycle of
that configuration. As such, the `baseline_security_profile` should likely contain
any subclasses responsible for repository hardening.

These are obviously heuristics and not hard & fast rules. But you'll find that the
fewer relationships you specify, the fewer dependency cycles you run into. As you
build more and more complex configurations and reuse more and more code, you'll be
glad to not have architected yourself into a dependency corner.
