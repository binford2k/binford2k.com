---
layout: post
title: "Agent Side Functions in Puppet 6"
summary: "Deferring a Puppet function to runtime."
category:
tags: ["puppet", "development"]
---

Puppet 6 introduced _Deferred functions_, a new feature that allows you to run code on the agent side during enforcement. This is both functionality that people have been requesting for ages, and also behaviour that many people already mistakenly assumed existed. As a matter of fact, the Puppet execution model isn't very well understood at all and many people already think they're using Puppet like a shell script engine!

So first, let's take a quick look at how the catalog gets built and enforced. There are a few stages we need to understand.



1. The agent generates facts about itself and sends them to the master.
2. The master uses these facts, the Hiera data, and the Puppet codebase to build a catalog — the state model that describes how the agent should be configured.
3. The agent then enforces that configuration and sends a report back to the master describing any changes that were made.


![Data flow during catalog compilation](/assets/images/DataFlowNodesJson.png "Data flow during catalog compilation.")


The key point to understand about this model is that only static data is exchanged between the master and the agent. For example, the catalog is a static JSON document that simply lists out resources that should exist and the properties they should have. See the simplified example below (note that some elements have been omitted for readability.)


``` json
$ jq '.resources[] | select(.type == "Service" and .title == "pxp-agent")' catalog.json
{
  "type": "Service",
  "title": "pxp-agent",
  "parameters": {
    "ensure": "running",
    "enable": true
  }
}
```


There's no way to tell what code or logic was used to generate this, and there's no way to make conditional decisions based on this resource other than just standard resource relationships. For example, you cannot run an `exec` command to perform some kind of initialization process if a `service` resource fails to start properly. Functions that ran during compilation don't show up in the catalog at all!

People often want to use `exec` resources to generate values or for conditional logic. But as you can see here, they're just another resource with parameters that describe their desired state. The results aren't known at compile time, so they cannot be used in conditional statements in your Puppet code.


``` json
$ jq '.resources[] | select(.type == "Exec" and .title == "tunnelblick autoupdate")' catalog.json
{
  "type": "Exec",
  "title": "tunnelblick autoupdate",
  "parameters": {
    "command": "defaults write net.tunnelblick.tunnelblick updateCheckAutomatically -bool 'true'",
    "path": "/usr/bin",
    "user": "ben",
    "unless": "defaults read net.tunnelblick.tunnelblick updateCheckAutomatically | grep -q '1'"
  }
}
```


This is designed for consistency and predictability. By looking at the catalog, you **_know_** that after it's been enforced that the `pxp-agent` service will be running and will start on bootup. Shell scripts, or other evaluated code, don't have this property. Instead the end state depends on a monumentally complex intersection of preconditions and assumptions. In a nutshell, having provable end states is why many auditors accept Puppet catalogs and/or reports as valid proof of compliance.

So why would we want to build in the ability to run functions on the agent during enforcement? Didn't we just say that lacking this ability makes the catalogs more provable? That would be true if we were talking about unchecked agent-side execution. We're not, however. There are tight constraints on what you can do with Deferred functions.


## Known unknowns

Let's talk about values that aren't known at compile time. They're resolved at runtime. This might sound a little concerning, but we already do this all the time. Think about typing puppet.com into your web browser. Your OS actually resolves that to an IP address (and then the physical hardware eventually resolves it even further!) Or think about using your package manager to `yum install nginx` without knowing exactly which version that would resolve to. Or maybe you wanted to grab a password from the Vault server and write it into a config file without the Puppet master also having access to it….

See, that was a bit of foreshadowing. Up until Puppet 6, there wasn't really a good way to do that. For Puppet to manage a file, it had to know the contents of that file when the catalog was compiled. In other words, your Puppet master needed access to all the secrets of your entire infrastructure. Since anyone with commit privileges can write code to access and potentially leak those secrets, it also meant that you needed very tight constraints on code reviews.

This is the first and most essential use case for a Deferred function: to resolve a value at runtime that the master cannot or should not have access to for whatever reason.

The second use case is for describing intent. Your job with Puppet is to create immutable configuration that is as expressive as possible. Puppet converges your node to the state you describe each time it runs and it's up to you to make that state as descriptive as possible. Just like the IP address of `216.58.217.46` isn't very descriptive in comparison to the human-readable label of `google.com`, writing code that shows how an API token is resolved from the Vault server is infinitely more readable than a random string of characters.

Some examples of resolving data at runtime could include:

* [Decrypting ciphertext](https://github.com/binford2k/binford2k-node_encrypt) during catalog application.
* [Service discovery](https://github.com/ploperations/ploperations-consul_data) between nodes at runtime.
* Retrieving API tokens to be used by other resources during catalog application

In short, you should use deferred functions as named placeholders for runtime data when that makes sense because the label describes intent more than the value is resolves to.


## Deferring a function to runtime

After all that conversation, this might be a bit anticlimactic because they're so easy to use. Any Puppet 4.x function that returns a value and doesn't do anything funky with scope or with the catalog internals can be deferred. Here's an example of building a templated file on the agent by deferring two functions, the Vault password lookup and the epp template compilation.


``` puppet
$variables = {
  'password' => Deferred('vault_lookup::lookup',
                  ["secret/test", 'https://vault.docker:8200']),
}

# compile the template source into the catalog
file { '/etc/secrets.conf':
  ensure  => file,
  content => Deferred('inline_epp',
               ['PASSWORD=$password', $variables]),
}
```


The Deferred object initialization signature is simple and returns an object that we can assign to a variable, pass to a function, or use like any other Puppet object:


``` puppet
Deferred( <name of function to invoke>, [ array, of, arguments] )
```


This object actually compiles directly into the catalog and its function is invoked as the first part of enforcing a catalog. It will be replaced by whatever it returns, similar to string interpolation. The catalog looks something like the JSON hash below. First the `password` key is replaced with the results of the `vault_lookup::lookup` invocation, and then the `content` key is replaced with the results of the `inline_epp` invocation and then Puppet can manage the contents of the file without the master ever knowing the secret.


``` json
$ jq '.resources[] | select(.type == "File" and .title == "/etc/secrets.conf")' catalog.json
{
  "type": "File",
  "title": "/etc/secrets.conf",
  "parameters": {
    "ensure": "file",
    "owner": "root",
    "group": "root",
    "mode": "0600",
    "content": {
      "__ptype": "Deferred",
      "name": "inline_epp",
      "arguments": [
        "PASSWORD=$password\n",
        {
          "password": {
            "__ptype": "Deferred",
            "name": "vault_lookup::lookup",
            "arguments": ["secret/test", "https://vault.docker:8200"]
          }
        }
      ]
    },
    "backup": false
  }
}
```


In short, agent side functions are totally a thing now, with certain guardrails. Any Puppet 4.x function can be deferred as long as it resolves to a value and doesn't muck with catalog internals. It should have no side effects, and you should use deferred functions as named placeholders for late-resolved values. And as always, focus on providing intent rather than being clever.


# Learn More

*   See my CfgMgmtCamp [presentation](https://binford2k.github.io/node_encrypt_deferred) on Deferred functions.
*   Read the docs for [writing a Puppet 4.x function](https://puppet.com/docs/puppet/latest/writing_custom_functions.html).
*   Read the docs for [deferring a function](https://puppet.com/docs/puppet/latest/integrating_secrets_and_retrieving_agent-side_data.html)
