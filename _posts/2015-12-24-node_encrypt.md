---
layout: post
title: "Sharing secrets with Puppet, secretly."
image: keys.png
tags: [puppet, security, encryption, configuration, "configuration management"]
---
If you've used Puppet for anything non-trivial, you've almost certainly used it
to configure something secret. Perhaps you've configured an application with a
database password. Perhaps you've configured a local maintenance user account
with a private SSH key. Something that might seem obvious in retrospect is that
these secrets exist in the catalog--and by extension all reports and any other
tooling that uses them. Anyone with access to the catalog or raw reports also
has access to your secrets. All your secrets.

Before we go any further, let's set the stage a bit and make sure we're not
fearmongering here. Secrets have to be transmitted somehow and we've been doing
this for years. I'm sure some of you remember trying to figure out how to
protect your SSL certificates with a passphrase without having to manually type
it in every time you restarted Apache. Most of us gave up and just didn't use a
passphrase. It's the classic bootstrapping problem. If your secrets weren't in
your Puppet catalog, they'd be in a Kickstart script or the like, or you'd be
manually provisioning machines. As a result, in a well architected
infrastructure, Puppet catalogs and reports are considered to be sensitive
information and access to them is strictly limited.

But it would sure be nice if it didn't have to be.

## Transparent encryption:

My [node_encrypt module](https://forge.puppetlabs.com/binford2k/node_encrypt)
allows you to securely transmit secrets to any Puppet agent in your
infrastructure in a safe and secure fashion, with no configuration or setup
required. It will reuse and piggyback on top of the existing Puppet PKI
infrastructure, meaning that each node has secrets encrypted for it and for it
alone. Let's look at it in practice. Once you've installed the module1, you can
declare an encrypted resource like as the following:

``` puppet
node_encrypt::file { '/var/www/sites/default/settings.php':
    owner   => 'root',
    group   => 'www-data',
    mode    => '0640',
    content => template('drupal/settings.php.erb'),
}
```

This manages a file on disk using most of the same attributes as a standard `file`
resource type. Aside from `content`, the parameters actually are passed directly
to a `file` resource. This means that you can use `file` attributes as [documented](https://docs.puppetlabs.com/references/latest/type.html#file-attributes).
The Puppet master will encrypt the content of the file using that agent's public
key. Only that agent will be able to decrypt it--using its private key, of
course. The actual plain-text content of the file will never exist in the
catalog or in any reports. Instead, the catalog will look something like this:

``` json
{
  "type": "Node_encrypt::File",
  "title": "/var/www/sites/default/settings.php",
  "tags": ["node_encrypt::file", "node_encrypt", "file", "node", "default", "class"],
  "file": "/etc/puppetlabs/code/environments/production/manifests/site.pp",
  "line": 43,
  "exported": false,
  "parameters": {
    "owner": "root",
    "group": "root",
    "content": "<<encrypted>>",
    "ensure": "file",
    "path": "/var/www/sites/default/settings.php"
  }
}, {
  "type": "File",
  "title": "/var/www/sites/default/settings.php",
  "tags": ["file", "node_encrypt::file", "node_encrypt", "node", "default", "class"],
  "file": "/etc/puppetlabs/code/environments/production/modules/node_encrypt/manifests/file.pp",
  "line": 43,
  "exported": false,
  "parameters": {
    "ensure": "file",
    "group": "www-data",
    "mode": "0640",
    "owner": "root"
  }
}, {
  "type": "Node_encrypted_file",
  "title": "/var/www/sites/default/sites.php",
  "tags": ["node_encrypted_file", "node_encrypt::file", "node_encrypt", "file", "node", "default", "class"],
  "file": "/etc/puppetlabs/code/environments/production/modules/node_encrypt/manifests/file.pp",
  "line": 66,
  "exported": false,
  "parameters": {
    "content": "-----BEGIN PKCS7-----
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
gmL7mkI/mRPy
-----END PKCS7-----",
    "before": "File[/var/www/sites/default/settings.php]"
  }
}
```

When the agent enforces the catalog, the ciphertext will be decrypted using the
agent's private key and validated against the Puppet CA certificate chain. And
that's it.

> Plug and play catalog encryption.

## Advanced usage:

Ok, I lied. There are a few situations in which it doesn't just magically work
out of the box. But even these are pretty easy to set up and use. Most of the
time you won't have to bother with this section.

### Command line encryption:

If you'd like to pre-generate your ciphertext instead of encrypting on each
catalog compile, you can do that with the `puppet node encrypt` subcommand. It
requires a target node and will encrypt text from the the command line.

```
master.example.com:~ # puppet node encrypt --target agent04.example.com "This is an encryption test."
-----BEGIN PKCS7-----
MIIMtQYJKoZIhvcNAQcDoIIMpjCCDKICAQAxggJ7MIICdwIBADBfMFoxWDBWBgNV
BAMMT1B1cHBldCBDQSBnZW5lcmF0ZWQgb24gcHVwcGV0ZmFjdG9yeS5wdXBwZXRs
YWJzLnZtIGF0IDIwMTUtMTItMTEgMDE6MTk6MzYgKzAwMDACAQswDQYJKoZIhvcN
AQEBBQAEggIAewpGiy5qXEB3tLOlqpuBRfp27LdCO8CX5NreVJvX8LiyP/FjCgXh
[...]
KB6KDiUOpHW7v0Bnx7YduqvOrwTf3fBOFbxJ3lp1oLa4AyTY8QyIHMol2cvLr799
j8RN2PD9WmPsoBHesCCOXhPjxODuaXOeY7rM0gDI4dv2TwWlOZbdFothVB2OzL5k
YUMmFfXNeKyVdpr0A7N22fyJk2i2Q8r/9xQAD7IDNq4vgIt5k+SZmj+ykQcF6snX
xlMGT570F1K1b4QVLrDD5zK8nVKD7zBWG9arf+POeosNLSPGmU+99dnL+NXrF5bm
Nz8Adpo3D5Qf1v7Dsoj+z1dkNQOpVezbgHzVuL9tIk3TayR2C4lFSNo=
-----END PKCS7-----
master.example.com:~ #
```

This cipher text can be pasted directly into a manifest, or (better) saved as
Hiera data and passed to the `node_encrypt::file` resources as the
`encrypted_content` parameter. In this way you can slightly lower the load on your
master, or you can generate catalogs with secrets on nodes that are not the CA.

### Using with compile masters:

Speaking of non-CA nodes, let's take a moment to discuss certificates. Because
the CA node signs all agent certificates, it has the public certificate for each
node in the Puppet infrastructure. It is the only node with these certificates.
That means that **out-of-the-box, the CA is the only node which can encrypt
secrets**.

Clearly this won't work for many infrastructures. If you've got more than 800 or
so nodes, you're almost guaranteed to have some compile masters. The
`node_encrypt::certificates` class was designed for this use case. It will
synchronize certificates across your infrastructure so that encryption works
from all compile masters. Simply include this class on all your masters,
including the CA or Master of Masters. It will make sure that all compile
masters have all agents' public certificates by creating a fileserver mount on
the CA node and then copying certificate files from this mount point to each
compile master.

If you'd like to limit access to the certificate mountpoint, you can pass a
comma-separated list of compile master nodes as the whitelist parameter. Note
that in either case, only public certificates are ever available in this
fashion.

Once Puppet has run on the CA node and then each of the compile masters, they
too will be able to encrypt secrets for any node in the infrastructure. This
certificate synchronization will stay current, meaning that certificates for any
new nodes will automatically be synchronized to compile masters.

### Parser function:

The encryption is performed by a parser function during catalog compilation. You
can call this function yourself to manually generate ciphertext. This will
mostly be useful if and when third-party modules adopt this encryption scheme.
For example, with this [pull request](https://github.com/richardc/puppet-datacat/pull/17/files)
to _rc's `datacat` module, you can encrypt values in the catalog before they're
constructed on the node. I'll do a followup post soon on using this encryption
in your own module.

``` puppet
datacat { '/tmp/test':
  template_body => 'Decrypted value: <%= @data["value"] %>',
  show_diff     => false,
}
datacat_fragment { 'encryption test':
  target => '/tmp/test',
  data   => {
    value => node_encrypt('This string will not be included in the catalog.'),
  },
}
```

## Ecosystem:

Other tools certainly exist in this space. One of the most well known in the
Puppet ecosystem is [Hiera Eyaml](https://github.com/TomPoulton/hiera-eyaml),
which is intended to protect your secrets on-disk and in your repository. With
Hiera eyaml, you can add secrets to your codebase without having to secure the
entire codebase. Having access to the code doesn't mean having access to the
secrets in that code. But the secrets are still exposed in the catalog and in
reports. You should be protecting them as well using something like
`node_encrypt`.

> You can (and should) use `eyaml` to store your secrets on disk, while you use
> `node_encrypt` to protect the rest of the pipeline.

Another tool is [Conjur](https://www.conjur.net/). This is an entire secret
management platform, with all the benefits and drawbacks that come along with
it. Once it's configured across your infrastructure, you can pass secrets
out-of-band so that the Puppet master never even sees them. It requires some
configuration and each node requires authentication to the secret server--the
standard bootstrapping problem again. It's not as transparent, and it's
certainly not zero-config. Nevertheless, it's worth investigating due to its
integration with many other tools in your infrastructure and its richer control
over secret dissemination.

## GitHub Project:

I'd love it if you tried out the module and gave me some feedback. Is there
something that it's missing? Is there an edge case that I'm not catching? Did it
eat your puppy and make faces at your baby? File an issue or send me a pull
request!

[https://github.com/binford2k/binford2k-node_encrypt](https://github.com/binford2k/binford2k-node_encrypt)
