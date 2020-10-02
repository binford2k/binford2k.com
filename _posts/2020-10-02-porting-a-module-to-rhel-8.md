---
layout: post
title: "Porting a module to RHEL 8"
summary:
image:
category: "module developer tips"
tags: [puppet,tutorials,"configuration management"]
conditions:
  - The module supports RHEL 7, but not RHEL 8
---

Often, updating a Puppet module to work on a newer platform is mostly a case of
fixing up a a few paths or package names. Sometimes though, more significant
changes are called for. When updating to RHEL (or family) 8, here are some major
changes that we've had to account for:

* `dnf` is the new standard package manager.
* Some services only log to systemd now and not to `/var/log/*`
* X.org has finally been superseded by Wayland.
* `iptables` had been replaced with `nftables`.
* The default Python version is now 3.x.
* Replacing `ntpd` with the new `chrony` service. Yes, that means you now have
  `cronie` and `chrony`. Good luck keeping those straight!

We'll come back and update this post as we run into more gotchas.
