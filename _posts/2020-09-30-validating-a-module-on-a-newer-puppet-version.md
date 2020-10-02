---
layout: post
title: "Validating a module on a newer Puppet version"
summary:
image:
category: "module developer tips"
tags: [puppet,tutorials,"configuration management"]
conditions:
  - Supported Puppet versions list does not include current Puppet
---

Puppet modules declare their own Puppet version support. In other words, the
module developer will use the `metadata.json` file to indicate the Puppet
versions they have tested against. Most notably, that means that a module not
declaring support for the latest version of Puppet does not necessarily mean
that it ***does not*** support that version, it might just mean that the
developer hasn't validated it yet and hasn't gotten around to making a new
release with the metadata updated.

In other words, if a module doesn't claim support for the version of Puppet that
you are running, it's likely that it will work anyway.

If the module has already been updated to use the [PDK](https://puppet.com/try-puppet/puppet-development-kit/),
then you can simply use the built-in version switcher to check this:

```
$ pdk test unit --puppet-version 6                                                                                                                                                                                     *[main]
pdk (WARN): This module is compatible with an older version of PDK. Run `pdk update` to update it to your version of PDK.
pdk (INFO): Using Ruby 2.5.8
pdk (INFO): Using Puppet 6.17.0
[✔] Preparing to run the unit tests.
[...]
```

For older modules which have not yet been updated or when the PDK test framework
itself fails, you'll have to set up the test environment yourself. That means:

* Install the desired Puppet version.
* Install [Bundler](https://bundler.io)
* Run spec tests with something like `bundle exec rake spec`

If the tests pass, then you've got a reasonable expectation that the module will
work for you!

If you'd like, you may want to inform the module author of your work. This will
let other people benefit from your knowledge and is relatively straightforward
to do. Just choose the option below that you're most comfortable with:

1. [File a ticket](/module%20developer%20tips/2020/10/01/reporting-a-problem-with-a-module/) describing what you've discovered.
1. [Contribute a pull request](/module%20developer%20tips/2020/10/01/contributing-a-pull-request/) updating the support declaration yourself.

We hope this information was helpful!
