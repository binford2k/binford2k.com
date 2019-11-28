---
layout: post
title: "Automagic Puppet Function Updater"
image: magic.jpg
tags: [puppet, development, refactor, modern, magic]
---

Last week I wrote about [porting legacy Ruby Puppet functions]({{ site.baseurl }}/2019/11/refactoring-legacy-functions/)
to the modern API.  It struck me how programatic the refactoring process was, so
I wrote a tool to automate much of it. The functions it generates are not great
but they're a start, and they're validated to at least *work* during the process.

## Installing

The tool is distributed as a Ruby gem with no dependencies, so simply `gem install`.

```
$ gem install puppet-function-updater
```


## Usage

Run the command `puppet_function_updater` in the root of a Puppet module, then
inspect all the generated functions for suitability when it's done. If you pass
the `--clean` argument it will **delete the legacy function file from disk**
after validating that the new function works.

### Example:

```
[~/Projects/puppetlabs-stdlib]$ puppet_function_updater --verbose
INFO: Creating lib/puppet/functions/stdlib/abs.rb
INFO: Creating lib/puppet/functions/stdlib/any2array.rb
INFO: Creating lib/puppet/functions/stdlib/any2bool.rb
INFO: Creating lib/puppet/functions/stdlib/assert_private.rb
INFO: Creating lib/puppet/functions/stdlib/base64.rb
INFO: Creating lib/puppet/functions/stdlib/basename.rb
[...]
INFO: Creating lib/puppet/functions/stdlib/values_at.rb
INFO: Creating lib/puppet/functions/stdlib/zip.rb
INFO: Functions generated. Please inspect for suitability and then
INFO: update any Puppet code with the new function names.
INFO: See https://puppet.com/docs/puppet/latest/custom_functions_ruby.html
INFO: for more information about Puppet's modern Ruby function API.
```
You may notice some warnings inline. Generally they can be ignored. For example,
the following warning only means that the `deep_merge()` function has a `require`
statement outside the block defining the new function. This doesn't prevent my
tool from porting the function to the modern API.

```
INFO: Creating lib/puppet/functions/stdlib/deep_merge.rb
ERROR: The function attempted to load libraries outside the function block.
WARN: cannot load such file -- puppet/parser/functions (ignored)
```

However, the following error means that the porting process generated invalid
Ruby code and so the port was aborted without the new function being written. My
tool cannot fix poor code, only port it directly and it gives up quickly if it
cannot do it properly.

```
INFO: Creating lib/puppet/functions/stdlib/validate_x509_rsa_key_pair.rb
ERROR: Oh crap; the generated function isn't valid Ruby code!
ERROR: <compiled>:47: dynamic constant assignment
    NUM_ARGS = 2 unless defined? NUM_ARGS
             ^
```

Now that all the new functions are written comes the most important part, your
part! Now you should inspect each function and update their documentation or
clean up anything about the implementation that you'd like.

Note that all their names have changed slightly. They've been namespaced with the
module name. This means that you'll need to update any Puppet code that uses these
functions to account for that.

And that's it. You can stop here if you like.

Well, unless you want to take advantage of the new function API hotness, that is.
Read on if you're interested in improving the function and removing pointless
boilerplate code.

## Writing new function signatures

The old API didn't capture any information about the function signature. It always
just passed the arguments as a single untyped array, which you as the programmer
were expected to handle. Unfortunately, that means that I cannot programmatically
infer what the argument types are expected to be.

For this reason, the generated function uses a single dispatch using a `repeated_param`
to capture all arguments into a single untyped array and passes that to the
implementation method. Gross hack, but it works.

``` Ruby
dispatch :default_impl do
  # Call the method named 'default_impl' when this is matched
  # Port this to match individual params for better type safety
  repeated_param 'Any', :arguments
end
```

To improve the parameter handling, you should read the implementation code and
convert the manual handling into proper dispatch definitions. In the case of the
`abs()` function, the parameter handling looks like this:

``` ruby
def default_impl(*arguments)
  raise(Puppet::ParseError, "abs(): Wrong number of arguments given (#{arguments.size} for 1)") if arguments.empty?
  value = arguments[0]

  # Numbers in Puppet are often string-encoded which is troublesome ...
  if value.is_a?(String)
    if value =~ %r{^-?(?:\d+)(?:\.\d+){1}$}
      value = value.to_f
    elsif value =~ %r{^-?\d+$}
      value = value.to_i
    else
      raise(Puppet::ParseError, 'abs(): Requires float or integer to work with')
    end
  end

  # We have numeric value to handle ...
  result = value.abs

  return result
end
```

This can be improved by converting it into one or more dispatches and simplified
implementation methods. Notice how little code is now required because we can now
trust that the language will enforce the proper data types.

**Notice that we removed the splat (`*`) from the method signature!**

``` Ruby
dispatch :default_impl do
  param 'Numeric', :value
end

def default_impl(value)
  value.abs
end
```

Let's look at a more complex function, `join()`. This function takes one or two
parameters. The first is an array of values, and the second is an *optional* separator.
The function will join the array into a string, separated by the separator string.

The originally ported implementation looks like

``` Ruby
dispatch :default_impl do
  # Call the method named 'default_impl' when this is matched
  # Port this to match individual params for better type safety
  repeated_param 'Any', :arguments
  end


def default_impl(*arguments)
  # Technically we support two arguments but only first is mandatory ...
  raise(Puppet::ParseError, "join(): Wrong number of arguments given (#{arguments.size} for 1)") if arguments.empty?

  array = arguments[0]

  unless array.is_a?(Array)
    raise(Puppet::ParseError, 'join(): Requires array to work with')
  end

  suffix = arguments[1] if arguments[1]

  if suffix
    unless suffix.is_a?(String)
      raise(Puppet::ParseError, 'join(): Requires string to work with')
    end
  end

  result = suffix ? array.join(suffix) : array.join

  return result
end
```

We can see that there are two signatures, so let's update the dispatch definition.

``` Ruby
dispatch :default_impl do
  param 'Array', :values
end

dispatch :separator_impl do
  param 'Array', :values
  param 'String', :separator
end

def default_impl(values)
  values.join
end

def separator_impl(values, separator)
  values.join(separator)
end
```

Now we have functions that enjoy all the benefits of the modern API, plus they're
approximately 9,000x easier to read.


## Documentation

I'm sure you've noticed that the documentation comments in the function are hot
garbage. That's all right. It was probably time for you to take a look at that
anyway. You should clean up the documentation to be both readable and to match
the [`puppet-strings`](https://puppet.com/docs/puppet/latest/puppet_strings.html)
format. This will help you automatically document your module on the
[Puppet Forge](https://forge.puppet.com/) on your module's *Reference* tab.


## Testing

Apologies, but the `puppet_function_updater` tool does not yet create spec tests
for the new function. I will come back and update this post when it does, but in
the meantime you should write your own. Or at least run the new function through
its paces in some Puppet code.


## Got feedback?

I'd really love feedback. Post issues on the [project](https://github.com/binford2k/puppet-function-updater).
And if you can provide your feedback as a pull request, that's even better!

## Learn more

* Check out the [`puppet-function-updater` project on GitHub](https://github.com/binford2k/puppet-function-updater)
* Read more about [custom functions](https://puppet.com/docs/puppet/latest/custom_functions_ruby.html).
* Read more about [documenting your functions or other Puppet code](https://puppet.com/docs/puppet/latest/puppet_strings.html).
