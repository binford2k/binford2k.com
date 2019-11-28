---
layout: post
title: "Upgrade to Puppet 4.x functions already!"
image:
tags: [puppet, development, refactor, modern]
---
For many years, you've been able to extend the Puppet language by writing custom functions in Ruby. And since the functions were autoloaded from modules, a large ecosystem developed adding all sorts of functionality. For example, [`puppetlabs/stdlib`](https://forge.puppet.com/puppetlabs/stdlib) includes a smorgasbord of string manipulations, data validations, data structure munging, etc. But the original function API had many critical limitations, and Puppet introduced a new and improved API with Puppet 4.x. I'd like to tell you about some of the benefits and how to upgrade your own functions to the new API. It's surprisingly easy to do!

The end user won't notice much of a difference except in pathological cases, but the incremental benefits will be cumulative. Each modern Puppet 4.x function is just a little faster and just a little safer to use. As module developers port their functions over, compilation times will get more and more performant. Modern Puppet 4.x functions have improved threadsafety, memory management, and load time. Even more importantly, they're [isolated to the environment they're loaded from]({{ site.baseurl }}/2015/08/31/environment-leakage/).

Let's do a quick summary of that one, because it's important and is worth unpacking the implications. Legacy Puppet functions were subject to environment leakage, which in short means that **legacy functions in a dev environment were often accidentally also evaluated in production environments**. The Ruby runtime would only allow a single version of a function, so whichever one loaded first would be the one used for all environments. Effectively, whichever agent happened to check in first would "lock in" the version of the function that would be used for the lifetime of the compiler. Puppet 4.x functions are isolated to their own environment so that even if you have different versions of a function in different environments, the proper one will be used every time a catalog is compiled.

The developer writing Puppet code will notice several improvements by using the new API though. The most obvious benefit is probably that namespaced function names make it a lot easier to find the definition of a function you're using and to prevent name collisions. For example, let's say that a module in your codebase uses the legacy API to define a function named `munge_arguments()`. This is poor practice because the name isn't very unique, but it's unfortunately not unheard of. The problem arises when you install a second module that also defines a different function named `munge_arguments()`. It's functionally indeterminate which function will be invoked when you use that name if two functions with the same name exist. That means that both modules and all your code will all use the same function, and **you don't have a way to know which one** is called!

The modern function API provides a namespace, so when you invoke `mymod::munge_arguments()`, you never accidentally run the `myothermod::munge_arguments()` function. You also can see exactly how to find the source of the function on disk, because the name shows that it's located in the `mymod` module.

The developer writing functions in Ruby code will see the most benefit. Functions using the modern API can use type checking in their signatures, meaning that the author no longer needs to write scads of code to ensure that the proper kind of data was passed to the function. They can also write multiple implementations of the function to deal with different types of arguments. For example, if you wrote a [`camelcase()`](https://en.wikipedia.org/wiki/Camel_case) function, you could write one implementation that camel cased a string, and another implementation that would take an array of strings and camel case each item by invoking the first implementation repeatedly. And because you didn't write an implementation that accepted numbers, Puppet would automatically throw an error if the user tried to camel case a numeric value!

This reduces the need for function sprawl, or writing a lot of different functions that do very similar things. Instead, the function author can group all those into a single function that includes multiple implementations and and any helper code needed. This also reduces the need for writing shared library code. Now that you've had the thought exercise of inventing  your own `camelcase()` function, you might read through the [source of the built-in version](https://github.com/puppetlabs/puppet/blob/master/lib/puppet/functions/camelcase.rb) to see an example of this and how close your ideas match up with its implementation.


## Porting to the modern API

By now, I hope that I've convinced you that it's worth upgrading your modules. So how do you get started? Luckily, it's actually pretty easy to do.

Let's start by looking at the signature and syntax of a legacy Ruby function:


``` ruby
# <MODULE>/lib/puppet/parser/functions/strlen.rb
module Puppet::Parser::Functions
  newfunction(:strlen,
             :type => :rvalue,
             :doc  => "Just a naive strlen example"
  ) do |args|
    raise "Wrong number of args" unless args.size == 1
    raise "Wrong type of args" unless args.first.is_a String
    value = args.first

    value.length
  end
end
```

This function definition required you to specify an arcane `:type` parameter defining whether or not the function returns a value. It also just stuffed all arguments into an array and required you as the author to manually process said array and handle any type checking or argument errors. This might be somewhat familiar to old school Perl hackers, but is unnecessary boilerplate these days.

Instead, the modern version of this same function would look like this:


``` ruby
# <MODULE>/lib/puppet/functions/mymod/strlen.rb
# @summary
#   Just a naive strlen example
#
Puppet::Functions.create_function(:'mymod::strlen') do
  # @param value
  #   The string to calculate the length of
  #
  # @return [Integer]
  #   The length of the input string
  #
  dispatch :default_impl do
    # call the method named 'default_impl' when this is matched
    param 'String', :value
  end


  def default_impl(value)
    value.length
  end
end
```

Notice that while it looks like more code, most of it is far more expressive comments. These use [puppet-strings](https://github.com/puppetlabs/puppet-strings) format, a superset of standard [YARD documentation strings](https://yardoc.org). The body of the function is just a `dispatch` method call which registers a function _signature_ and the method to call when that signature is matched.

In this example, there's only one dispatch. When the function is invoked with a single String as an argument, the `default_impl` method is called with that string as an argument. If the function is invoked in any other way, Puppet's type checking system catches it and raises the appropriate error. It's worth noting that the name of this method is arbitrary, so choose whatever makes sense for your own function.

If there were different types of input data types that we wanted to count, then we could write as many implementations as we wanted and register them to data types with more `dispatch` calls. Gone is the need to do manual validation of types, or number of arguments, or any other validation. Gone is the need to process an arguments array. All that's left to do is implement the functionality we desire.

The process of porting is fairly straightforward. First you'll want to identify the different parts of the legacy function. There are four rough parts that we'll consider separately:

*   The function definition and structure. This doesn't include a function signature because that's implicit and we'll have to infer it by how arguments are handled.
*   Documentation about the function and how it works.
*   Argument handling and validation. We'll use this to infer the signature(s).
*   The implementation itself.

Let's look at the legacy function again, annotated with the parts we care about.


``` ruby
# <MODULE>/lib/puppet/parser/functions/strlen.rb
module Puppet::Parser::Functions
  newfunction(:strlen,                                         # definition/name
             :type => :rvalue,
             :doc  => "Just a naive strlen example"            # documentation
  ) do |args|
    raise "Wrong number of args" unless args.size == 1         # arg validation
    raise "Wrong type of args" unless args.first.is_a String   # arg validation
    value = args.first                                         # arg handling

    value.length                                               # implementation
  end
end
```


All the rest is just boilerplate. Now we'll need to infer the function signature(s). The logic in the argument validation and handling tells us that we handle only a single case: the function will only accept one string argument. Let's write that as a dispatch.


``` ruby
dispatch :default_impl do
  param 'String', :value
end
```


The `:default_impl` name is an arbitrary label. It tells Puppet which method to call when the function is invoked with a signature that matches this pattern. In this case, it will call the `default_impl()` method, but we could name it anything we wanted as long as they both match.

Then in the dispatch, we use one or more `param` calls to describe the function signature. Here, we only call it once, so this dispatch will only match a single `String` argument. Notice that we _quote the type name_ so that it's not evaluated as a type by the parser. We also provide a name for each parameter to be used in generated documentation and help output.

The API handles all the other validation for us, so we're done inferring the signature and can move on to the implementation. We named it `default_impl()` already, so let's write that method:


``` ruby
def default_impl(value)
  value.length
end
```


Now let's put the parts together and construct the new function. Generally speaking, our function will be in a module, so we'll also namespace the new function name to include the name of the module. Make sure to reflect that in the path as well.


``` ruby
# <MODULE>/lib/puppet/functions/mymod/strlen.rb
Puppet::Functions.create_function(:'mymod::strlen') do   # definition/name
  dispatch :default_impl do
    param 'String', :value                               # signature & arg validation
  end

  def default_impl(value)
    value.length                                         # implementation
  end
end
```

That's the minimally viable port. The final step is to expand the documentation using YARD/puppet-strings format to better explain how to use the function.

This only touches on the simplest case. The [developer docs for creating custom functions](https://puppet.com/docs/puppet/latest/custom_functions_ruby.html) describe more complex dispatch patterns, including variable repeating parameters, optional parameters, and more. It shows how to handle lambdas, how to invoke other functions, and how to write advanced iterative functions. And importantly, it describes some common gotchas when refactoring legacy functions that we glossed over here.

Good luck and happy refactoring!


# Learn more:

* Read more about [custom functions](https://puppet.com/docs/puppet/latest/custom_functions_ruby.html).
* Read more about [documenting your functions or other Puppet code](https://puppet.com/docs/puppet/latest/puppet_strings.html).
* Read about [limitations of Puppet environments](https://puppet.com/docs/puppet/latest/environments_about.html#concept-6445).
* Learn about writing [simple functions in the Puppet language](https://puppet.com/docs/puppet/latest/lang_write_functions_in_puppet.html) instead of Ruby.
