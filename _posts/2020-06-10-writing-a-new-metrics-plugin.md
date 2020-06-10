---
layout: post
title: Gathering metrics with a new Dropsonde plugin
summary: A quick tutorial on building a new metrics plugin for the Dropsonde telemetry framework.
image: lego_blocks.jpg
category:
tags: [puppet, telemetry, metrics, data, development, usage, forge]
---

I've been working on the Dropsonde telemetry framework for the Puppet ecosystem
for a while. If you've followed any of its development, you likely already know
that the main focus is on providing community value and maintaining privacy and
transparency.

Along those lines, the [data it generates is public](https://console.cloud.google.com/bigquery?p=dataops-puppet-public-data)
and you're invited to help implement the metrics, or even to use the framework
to gather your own metrics as long as they fit within our privacy standards. For
example, [David](https://twitter.com/moduletux) could use this framework to
identify how many people were using Slack or Rocket.Chat integrations with the
[Puppet Webhook Server](https://github.com/voxpupuli/puppet_webhook) by checking
the configured value of `chatops_service`.

This is a quick tutorial on building a new metrics plugin and then accessing the
data after it starts rolling in. To keep things simple, let's just count how many
environments an infrastructure has. This information would be useful for any tool
that works with code management, such as the aforementioned Puppet Webhook Server,
[Foreman](https://www.theforeman.org), the [Onceover](https://github.com/dylanratcliffe/onceover)
testing framework, or even Puppet itself.

Start off by reading the privacy alert in the [plugin docs](https://github.com/puppetlabs/dropsonde/blob/master/PLUGIN_API.md) (reproduced below).
You should skim that each time you start a new plugin, just to refresh your memory
about what's acceptable. In our case, it reminds us not to reveal environment
names themselves.

> ***📍Important note:***<br />
> We do not collect private information and we only collect information related
> to the Puppet ecosystem and which can provide benefits to the user for sharing.
>
> Examples of things we will not collect include (but are not limited to):
> * The names of private modules or classes
> * The names of environments other than standards like dev/staging/prod.
> * Hostnames or certnames
> * Custom facts not from Forge modules
> * Any git data (remotes, committers, etc.) extracted from the control repository.
>
> This list will evolve as our understanding of the privacy concerns grows, so
> refresh your reading of this each time you write a new metric.

Next, we'll create a new Ruby file in `lib/dropsonde/metrics/environments.rb` starting
with the [skeleton example](https://github.com/puppetlabs/dropsonde/blob/master/PLUGIN_API.md#metric-plugin-skeleton)
and adding a quick description of what we'll be gathering.

``` ruby
# lib/dropsonde/metrics/environments.rb
class Dropsonde::Metrics::Environments
  def self.initialize_environments
    # Require any libraries needed here -- no need to load puppet or puppetdb;
    # they're already loaded. This hook is named after the class name.
    # All plugins are initialized at startup before any metrics are generated.
  end

  def self.description
    # This is a Ruby squiggle heredoc; just a multi-line string with indentation removed
    <<~EOF
      This group of metrics gathers information about environments.
    EOF
  end

  def self.schema
    # return an array of hashes of a partial schema to be merged into the complete schema
  end

  def self.setup
    # run just before generating this metric
  end

  def self.run
    # return an array of hashes representing the data to be merged into the combined checkin
  end

  def self.example
    # this method is used to generate a table filled with randomized data to
    # make it easier to write data aggregation queries without access to the
    # actual private data that users have submitted.
  end

  def self.cleanup
    # run just after generating this metric
  end
end
```

After reading through the API documentation, it's clear that we don't need to do
anything special for initialization, to set up, or to tear down our metrics, so
we'll ignore or omit the `self.initialize_platforms`, `self.setup`, and
`self.cleanup` methods.

That leaves three hooks to implement:

* `self.schema`
* `self.example`
* `self.run`

## Generating a schema

The `self.schema` method is critical, because not only does it define what data
you can return, it's also used to generate the BigQuery schema of the table
storing the submitted telemetry reports. This should return an Array of Hash objects
that follows the [BigQuery JSON schema docs](https://cloud.google.com/bigquery/docs/schemas#specifying_a_json_schema_file).

In our case, the data we're generating will be trivial--just a single named row
with a number, for example:

| Metric Name         | Value |
|---------------------|-------|
| `environment_count` | 3     |


This means that our schema can be fairly simple too. Note that we return an
array with a single item. If the plugin was generating other metrics as well,
each metric would be another entry in this array.

``` ruby
def self.schema
  [
    {
      "description": "The number of environments",
      "mode": "NULLABLE",
      "name": "environment_count",
      "type": "INTEGER"
    }
  ]
end
```

Each time the metric runs, the output it generates is validated against this
schema, so ensure that it's accurate or you'll never see any results!

You can see the complete schema by running `dropsonde dev schema`. Your partial
schema will be merged together with the partial schemas of all enabled plugins
and the system fields required for our telemetry endpoint, then printed out.


## Providing example data

Next up is `self.example`. This should return example representative data. That
might sound a bit weird, but think back to the dataflow for the framework for a
moment. None of the telemetry data we report on is _private_, but any time enough
bits are available then an entity is vulnerable to fingerprinting. For example,
if you saw that an infrastructure was in the `CEST` time zone, had the locale set
to `fr-ch`, and had tens or hundreds of thousands of nodes classified with various
[HPC](https://en.wikipedia.org/wiki/High-performance_computing) modules, then you
might surmise that you were looking at [CERN](https://home.cern) and use the rest
of that record as reconnaissance against them!

To avoid that possibility, the actual reported data is kept private and only a
small number of trusted employees have access. The data is run through a weekly
[aggregation job](https://github.com/puppetlabs/dropsonde-aggregation) that
sanitizes and aggregates it into publicly queryable stats.

![Data aggregation workflow](https://github.com/puppetlabs/dropsonde-aggregation/raw/master/aggregation.png)

To make it reasonable to develop the aggregation queries, metric plugins are
expected to provide made-up representative data that's combined and saved as the
[community_metrics](https://console.cloud.google.com/bigquery?p=dataops-puppet-public-data&d=community&t=community_metrics&page=table) BigQuery table which is publicly accessible.

The following method simply generates a random number of environments between 1 and 100:

``` ruby
def self.example
  [
    :environment_count => rand(1..100),
  ]
end
```

## Metric implementation

Now finally, we'll get to the meat of this already long tutorial: gathering
actual data. Since we have all Puppet libraries available to use, getting that
number is also pretty trivial.

``` ruby
def self.run
  [
    :environment_count => Puppet.lookup(:environments).list.count,
  ]
end
```

## Running and validating the new metric

Obviously, you will not be able to actually submit data any data to the
telemetry pipeline until the data storage schema is updated. But that's not
necessary for testing. Dropsonde internally validates each plugin schema and
ensures that the data gathered matches that schema. In other words, as long as
your data and schema are consistent, then the pipeline will accept and record
the metrics you gather.

To validate and observe the data your plugin will collect use the `preview`
command and enable only your new plugin:

``` sh
$ dropsonde --enable environments preview

                      Puppet Telemetry Report Preview
                      ===============================
Dropsonde::Metrics::Environments
-------------------------------
This group of metrics gathers information about environments.
- environment_count: The number of environments
    1


Site ID:
bab5a61cb7af7d37fa65cb1ad97b2495b4bdbc85bac7b4f9ca6932c8cd9038dd7e87be13abb367e124bfdda2de14949f8b3e8658931e39f58bcef23382d8f426
```

## Making the metric accessible

Now the plugin is complete. Next steps are to submit a pull request and then leave
it up to the Dropsonde maintainers to release it and update the database schema.
We'll just pretend for a moment that I'm not talking in the third person about
myself.

But it's not *completely* done yet. We'll need an aggregation query before any
results are publicly available. Our final step is to create a `number_of_environments.sql`
file in the [aggregation](https://github.com/puppetlabs/dropsonde-aggregation)
job repository. We'll make sure to use the production dataset in the query.

``` sql
-- This will generate an aggregate table consisting of the number of environments
-- exist in infrastructures and how many occurrences of that count there are.
SELECT environment_count, count(1) AS occurrences
FROM `bto-dataops-datalake-prod.dujour.community_metrics`
GROUP BY environment_count
```

## _finit!_

Now all we do is wait. Approximately one week after the new metric is released,
we'll start seeing data from it show up in the [public dataset](https://console.cloud.google.com/bigquery?p=dataops-puppet-public-data&d=aggregated).

See the actual [metrics plugin](https://github.com/puppetlabs/dropsonde/commit/daedf6f004a13c3c1b7acbaed8765240d2a01067)
and the [aggregation query](https://github.com/puppetlabs/dropsonde-aggregation/commit/cd647702c23d197faacb3177cbef1e76766b1d8d).

This was a pretty basic plugin. Next, I'll write about generating a far
more complex metric that involves some fairly heavy data manipulation!
