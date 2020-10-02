---
layout: post
title: "Reporting a problem with a module"
summary:
image:
category: "module developer tips"
tags: [puppet,tutorials,"configuration management"]
conditions:
  - Something about the module needs correction or updating
---

Have you found a problem with a module? Maybe it doesn't behave properly when
you enable SELinux, or maybe it just doesn't declare support for the latest
Puppet release. In any case, let's walk through how you can surface the problem
and maybe get it corrected.

First find the module on the Forge. You'll probably see a "Report issues" link.
Clicking that link will take you to the issue tracker for that module. For Puppet
supported modules, that will be Jira and you can click the big orange `[Create]`
button in the page header. For many others, it will take you to GitHub where you'll
see a green `[New issue]` button.

In any case, clicking the button gives you a space to describe the problem. Provide
a quick summary to make your issue discoverable in the issue queue, and then describe
what the problem is. Remember to include all needed context, including how to
reproduce a problem, and why the problem is important. If possible, include a
*minimal test case*, which is the smallest context that causes the issue to
arise.

For example, if the problem was a resource type that failed when passed a title
with spaces in it, then the minimal test case would be just that: a snippet of
Puppet code showing a resource declaration with spaces in it. Not a four page
description of your minikube environment and a `docker-compose.yaml` file.

In many cases, that description will be as simple as "the metadata should be
updated to support Puppet 6." But even in that case, you'll want to describe
how you've verified that--likely just that you ran `pdk test unit --puppet-version 6`
or that you've been running the module in production with the specified version.

Now that you've done this, maybe you'd like to [contribute a pull request](/module%20developer%20tips/2020/10/01/contributing-a-pull-request/)
to solve the problem yourself?
