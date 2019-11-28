---
layout: post
title: "In other news, spaceships have side effects."
summary: "So use binford2k/manifold instead!"
image: spaceships.jpg
tags: [spaceships, dependencies, puppet, resources]
---
Managing resource dependencies with Puppet is relatively straightforward. You
describe any relationships with metaparameters and Puppet figures out the order
it should enforce them in. Most dependency issues arise when users try to
overspecify dependencies as if they were writing a shell script. Puppet works
best when you [think in terms of relationships and dependencies rather than
ordering]({{ site.baseurl }}/2014/08/16/declarative-state-modeling/).

But there is one giant sticky issue. What about when you don't know the exact
resources you need to set relationships on ahead of time?

A good example of why that's useful is the use case of running an internal Yum
repository. Large infrastructures which can dedicate the resources to this will
often selectively mirror the upstream repositories. This reduce reliance on
external services, and allows greater control over versioning. Instead of just
trusting that upstream won't ever break, packages can be integration tested
against internal configuration and tooling before importing them to the internal
repository. High security sites may perform auditing as well.

Of course, this comes with a slight catch. The internal repository must be
enabled before installing packages. This ensures that internal-only packages
will install correctly, and it ensures that only trusted upstream packages are
installed. If you build this as part of your Kickstart provisioning, that's
taken care of. But what if you want to manage it with Puppet?

In the past, we've used primarily two solutions; [run stages](https://docs.puppet.com/puppet/latest/reference/lang_run_stages.html),
and [resource collectors](https://docs.puppet.com/puppet/latest/reference/lang_collectors.html).
I'll also present a new and better solution to the problem.

## Run stages:

This is how you'd solve the use case above with run stages:

``` puppet
# define a class
class internal_yum {
    yumrepo { 'internal':
      ensure   => 'present',
      baseurl  => 'http: //yum.example.com/el/7/products/x86_64/',
      descr    => 'Local packages',
      enabled  => '1',
    }
}

# declare a stage and specify that it happens before main
stage { 'first':
    before => Stage['main'],
}

# declare the class and assign it to the 'first' run stage
class { 'internal_yum':
    stage => Stage['first'],
}
```

This looks fairly straightforward, but run stages come with their
[own can of worms](https://docs.puppet.com/puppet/latest/reference/lang_run_stages.html#limitations-and-known-issues).
As such, docs has a pretty strong recommendation against them:

> Due to these limitations, **stages should only be used with the simplest of
> classes**, and only when absolutely necessary. Mass dependencies like package
> repositories are effectively the only valid use case.

## Resource collectors:

In recent years, we've been recommending using resource collectors with the
spaceship operator, so named because it resembles a spaceship: `<| |>`.

That would look something like:

``` puppet
# declare the repository
yumrepo { 'internal':
    ensure   => 'present',
    baseurl  => 'http: //yum.example.com/el/7/products/x86_64/',
    descr    => 'Local packages',
    enabled  => '1',
}

# then set a relationship so it's enforced before all packages
# ** don't actually do this! **
Yumrepo['internal'] -> Package<| |>
```

This is exploiting a side effect of resource collectors. Their primary purpose
is to [realize virtual resources](https://docs.puppet.com/puppet/latest/reference/lang_collectors.html#behavior).
This means that any resource matching the query in the collector
[will also be realized](https://docs.puppet.com/guides/virtual_resources.html#how-to-realize-resources)!
Because of this, I've also recommended against using virtual resources at all.
That isn't always a pragmatic recommendation, however, and in recent releases
even the `puppet_enterprise` module itself began using virtual package resources!

The practical effect of that is that the code snippet above has the small side
effect of potentially disrupting your entire Puppet infrastructure due to
attempting to install **all** Puppet Enterprise packages on all nodes.

> For best practices, you should **never use an unbounded resource collector**.

For best practices, you should never use an unbounded resource collector. You
should always provide a search query that matches exactly what you intend to set
relationships upon. Unfortunately, it's impossible for all intents and purposes
to make a [negative search expression matching tags](https://docs.puppet.com/puppet/latest/reference/lang_collectors.html#non-equality-search),
so it's not possible to make a relationship against all packages except those in
the `puppet_enterprise` module.

##Introducing the manifold resource type:

Luckily, I've got a new solution for you that avoids these side effects. I
created a new [`manifold` resource type](https://forge.puppet.com/binford2k/manifold)
that creates resources programatically for you. In a sense, it's somewhat like
the `anchor` type. It will allow you to declare a `manifold` resource and
provide it with patterns of other resources to generate dependencies on. Now,
when you make a dependency on that `manifold` resource, you can be assured that
the dependencies will transfer to all of its dependent resources as well.

``` puppet
# create the manifold resource
manifold { 'internal':
  type         => 'package',  # the type of resource to match
  match        => 'tag',      # what attribute to match on
  pattern      => 'internal', # provide a pattern to match
  relationship => before,     # set relationships on all matching resources
}

package { ['foo', 'bar', 'baz']:
  ensure  => present,
  tag     => 'internal',      # the manifold will match on this tag
}

yumrepo { 'internal':
  ensure   => 'present',
  baseurl  => 'http: //yum.example.com/el/7/products/x86_64/',
  descr    => 'Local packages',
  enabled  => '1',
  before   => Manifold['internal'], # standard resource relationship
}
```

The `yumrepo` resource will be enforced before the `manifold` resource, which in
turn will be enforced before any `package` resources tagged with `'internal'`.
The benefits of the resource collector search expression, without the side
effect of realizing virtual resources. It's also a little more explicit about
what your intent is.

![Intake manifest]({{ site.baseurl }}/assets/images/holley-ls-single-plane-mid-rise-intake-manifold.jpg){:.rightside}

So why the name? The [intake manifold](https://en.wikipedia.org/wiki/Inlet_manifold)
in your car's engine is a component that takes a single stream of air and
carefully splits it into a stream for each piston. The exhaust manifold works
similarly, only it takes each exhaust stream and combines it into a single
exhaust system.

The `manifold` resource type works similarly. It will allow you to set a single
relationship on that resource, and effectively transfers that relationship to
multiple other resources based on pattern matching rules. You can match based on
the title or any other attribute, and you can provide a string or a regular
expression to match against. You can also provide an invert bit which will
invert the effects of the search expression. Note that this is true inversion,
and doesn't have the same ineffective negation problem that resource collector
search expressions do.

It's early in development, but I hope that it becomes a standard part of your
toolbox and that you provide feedback in the form of issues or pull requests to
improve its functionality. It's got the potential to make this type of
relationship orders of magnitude safer.

Install it with `puppet module install binford2k/manifold` or by adding it to
your `Puppetfile` and try it out today!
