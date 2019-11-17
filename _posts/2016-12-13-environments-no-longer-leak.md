---
layout: post
title: "Environments no longer leak!"
image: env_leak.jpg
tags: [puppet, environment, "configuration management", caching]
---
Some time ago, I wrote about [Environment Leakage]({{ site.baseurl }}/2015/08/31/environment-leakage/),
and I'm happy to report that this is much less of a problem today. As of Puppet
4.8 and Puppet Enterprise 2016.5, most custom types will no longer be subject to
environment leakage. It's transparent for the end user, when Puppet Enterprise
Code Manager is configured, and can be used in Puppet Open Source by following
the [documentation](https://docs.puppet.com/puppet/4.8/environment_isolation.html).
Of note, this doesn't cover some more advanced custom types, such as those
defining title patterns with a Ruby proc.


