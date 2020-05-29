---
layout: post
title: "Telemetry that doesn't suck"
summary: Telemetry can help inform development decisions. Let's make sure it doesn't invade your privacy too.
image: telemetry-privacy.png
category:
tags: [puppet, telemetry, metrics, data, development, usage, forge]
---

We both know that you hate telemetry as much as I do. We've all seen the dreadful
rollouts of privacy invasions, the information leakage, and the abuse of private
data. I have third-party cookies disabled in my browser the same as you. So when
I started building [*Dropsonde*](https://github.com/puppetlabs/dropsonde), the
upcoming metrics framework for Puppet infrastructures, privacy was my highest
concern.

As a matter of fact, I have a firm rule that new features or metrics only get
implemented if they meet four criteria:

1. They provide real value to the end user <sup>(that's you)</sup>.
1. They're transparent about what data they collect, why they collect it, and what the data is used for.
1. They give you the ability to opt in or out without gating other benefits.
1. The data collected can be aggregated to [share publicly](https://console.cloud.google.com/bigquery?p=dataops-puppet-public-data).

In short, the only metrics I'll build are those that provide value to you *in
and of themselves* and also generate data that you can use in your own tooling.

So what does that actually mean? It means that the benefit that you derive comes
directly from sharing usage data. Think back to the time you last visited the
[Forge](https://forge.puppet.com) to find a module. Chances are that you
discovered many modules that claimed to solve your problem and it was relatively
difficult choosing between them. Surfacing usage data in a way that lets you
signal approval simply by using a module is the primary goal of this project.

We'll also be able to share usage patterns with Puppet module authors, so they know
how much time to devote to various parts of their modules, or so they know what
the potential impact is if they make breaking changes. This might, for example,
help [Vox Pupuli](https://voxpupuli.org) determine which platforms to support,
or to know when they can stop writing workarounds for older version of Puppet.

> 📍This means that the best way for you to help yourself find new modules, to
improve the quality of the modules you currently use, and to ensure that support
for your platform of choice is maintained is to  install this telemetry tool
and, along with your peers, share your module usage data.

## So how does it work?

First and foremost in its defense of your privacy, Dropsonde maintains a list of
all public Forge modules. It uses this list to distinguish between public and
your own private modules and only reports back information about public modules.
This ensures that you don't inadvertently leak information about your
infrastructure based on the names of modules or classes or anything else.

Second, there's an aggregation step before reports hit the public databases. The
actual submitted reports are stored in a private dataset that only a select
number of employees have access to. A weekly job runs a set of
[SQL queries](https://github.com/puppetlabs/dropsonde-aggregation)
to generate the public form of the usage patterns. You can help us write
interesting aggregation queries in that repository if you'd like. Periodically
we generate a [randomized dataset](https://console.cloud.google.com/bigquery?p=dataops-puppet-public-data&d=community&t=community_metrics&page=table)
of made-up data. Because it follows the same schema as production, that random
data can be used to to run aggregation queries against as they're being developed.

This public data is the same data that our internal tooling and module engineers
have access to. When our developers want to slice and dice the data for more
insights, they need to write and propose aggregation queries the same as you would.

This seems like a lot of extra work for us, and maybe it is. But it's worth it
to protect your privacy. The more bits of data shared about a specific site, the
easier it is to fingerprint that site. See [Panopticlick](https://panopticlick.eff.org/)
for a real-world example and see how identifiable your web browser is, even with
cookies and other tracking efforts blocked. This aggregation step makes it
impossible to use submitted data to "fingerprint" your site.

And finally, Dropsonde provides you mechanisms for seeing exactly what data will
be submitted and configuration options that allow you to control what data you're
willing to share.

## Using Dropsonde

Installing is pretty straightforward. Install the `puppetlabs-dropsonde` Puppet
module and classify your Puppet master with the `dropsonde` class. If you have
multiple compile masters, just classify the primary master. This will install the
tool and configure a weekly cron job to submit the reports.

Then you can see what the different [metrics plugins](https://github.com/puppetlabs/dropsonde/blob/master/lib/dropsonde/metrics/)
collect using the `list` subcommand. Any metrics plugin in this list may be
blacklisted by adding it as a parameter to the `dropsonde` class.

```
$ dropsonde list

                    Loaded telemetry plugins
                 ===============================

modules
--------
This group of metrics exports name & version information about the public
modules installed in all environments, ignoring private modules.

dependencies
--------
This group of metrics discovers dependencies between modules in all
environments. It will omit dependencies on private modules.

puppetfiles
--------
This generates interesting stats about Puppetfiles used in your environments,
including whether your Puppetfiles have Ruby code in them.
```

Then you can see exactly what the tool will report back with the `preview`
functionality. It generates a live report, slightly formatted for human
readability.  Because it follows the same `blacklist` setting as mentioned
above, you can directly see the result of blocking different metrics plugins.

You can even use the `--format=json` flag to get live data in machine readable
format if you'd like to use this data in your own tooling.


```
$ dropsonde preview

                      Puppet Telemetry Report Preview
                      ===============================

Dropsonde::Metrics::Puppetfiles
-------------------------------
This generates interesting stats about Puppetfiles used in your environments,
including whether your Puppetfiles have Ruby code in them.
- puppetfile_ruby_methods: Ruby methods used in Puppetfiles.
    {:name=>"puts", :count=>1}


Dropsonde::Metrics::Modules
-------------------------------
This group of metrics exports name & version information about the public
modules installed in all environments, ignoring private modules.
- modules: List of modules in all environments.
    {:name=>"apache", :slug=>"puppetlabs-apache", :version=>"5.4.0"}
    {:name=>"concat", :slug=>"puppetlabs-concat", :version=>"6.2.0"}
    {:name=>"stdlib", :slug=>"puppetlabs-stdlib", :version=>"6.3.0"}
    {:name=>"translate", :slug=>"puppetlabs-translate", :version=>"2.2.0"}
    {:name=>"mysql", :slug=>"puppetlabs-mysql", :version=>"10.5.0"}
    {:name=>"transition", :slug=>"puppetlabs-transition", :version=>"0.1.3"}
    {:name=>"ntp", :slug=>"puppetlabs-ntp", :version=>"8.3.0"}
    {:name=>"facter_task", :slug=>"puppetlabs-facter_task", :version=>"0.4.0"}
    {:name=>"package", :slug=>"puppetlabs-package", :version=>"0.5.0"}
    {:name=>"puppet_conf", :slug=>"puppetlabs-puppet_conf", :version=>"0.3.0"}
    {:name=>"service", :slug=>"puppetlabs-service", :version=>"0.6.0"}
- classes: List of classes and counts in all environments.
    {:name=>"Ntp", :count=>2}
    {:name=>"Ntp::Config", :count=>2}
    {:name=>"Ntp::Install", :count=>2}
    {:name=>"Ntp::Service", :count=>2}


Dropsonde::Metrics::Dependencies
-------------------------------
This group of metrics discovers dependencies between modules in all
environments. It will omit dependencies on private modules.
- dependencies: List of modules that private modules in all environments depend on.
    {"name"=>"puppetlabs/stdlib", "version_requirement"=>">= 4.20.0 < 7.0.0"}


Site ID:
bab5a61cb7af7d37fa65cb1ad97b2495b4bdbc85bac7b4f9ca6932c8cd9038dd7e87be13abb367e124bfdda2de14949f8b3e8658931e39f58bcef23382d8f426
```

Notice that at the bottom of the report is a *Site ID*. This is a `SHA512` digest
generated from your master's public SSL certificate, meaning that it's impossible
to reverse back into identifiable data. It's used only as a key in the private
database to maintain data integrity and never appears in any public form.

If you'd like to change your Site ID at any time, just configure a `seed` value
to be any string of characters you'd like and this will change the digest output.


## Using the data

The aggregated dataset is currently a bit sparse. Aggregation queries are still
being developed and we've only asked a few sites to test run the client for us.
That said, over the next few weeks and months, you should start seeing more and
more data show up here.

You'll need a [Google Cloud](https://cloud.google.com) account and then you can access the
[dataset](https://console.cloud.google.com/bigquery?p=dataops-puppet-public-data&d=aggregated)
with your browser via the BigQuery Console. Then you can run any queries you'd
like.

For example, this will get you the ten most used classes in the dataset:


``` sql
SELECT name, count
FROM `dataops-puppet-public-data.aggregated.class_usage_count`
ORDER BY count DESC
LIMIT 10
```

Currently with our extremely limited dataset, that result is:

``` json
[
  { "name": "Resource_api::Agent", "count": "272" },
  { "name": "Account",             "count": "272" },
  { "name": "Ssl::Params",         "count": "272" },
  { "name": "Classification",      "count": "272" },
  { "name": "Os_patching",         "count": "269" },
  { "name": "Ntp",                 "count": "265" },
  { "name": "Ntp::Install",        "count": "265" },
  { "name": "Ntp::Config",         "count": "265" },
  { "name": "Ntp::Service",        "count": "265" },
  { "name": "Zsh::Params",         "count": "265" }
]
```

## And so on and so forth

So what now? I hope that I've convinced to you install the client and give it a
go. Just add the `puppetlabs-dropsonde` module to your `Puppetfile`, deploy, and
then classify your primary master.

Next week I'll write a tutorial on contributing new metrics plugins, should you
be interested in gathering usage data yourself. And I'll also write a quick guide
on writing aggregation queries to help build new insights into all this information.
