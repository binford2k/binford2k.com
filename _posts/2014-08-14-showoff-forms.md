---
layout: post
title: "Embedding HTML forms in Showoff presentations"
image:
category:
tags: [showoff, technology, learning]
---
Something that's been missing in my [training classes](https://puppetlabs.com/services/training)
for a while is a quantitative method for monitoring how well the class was
keeping up. Instead, we relied on the ability of each instructor to effectively
read the class and adjust pace appropriately. This does work, but it's less
consistent than I'd like and it doesn't give me the ability to systematically
gather metrics about the knowledge retention of the different training sections.

Clearly, I needed something better.

Yesterday, I cut a new [Showoff](http://puppetlabs.github.io/showoff) release
that includes HTML form support. Over the next several weeks and months, I'll be
integrating mini quizzes into the material to regularly check up and see how
people are doing with the concepts.  The answers are all anonymous since the
aggregate information is all I'm concerned with right now.

So how does this work? I've extended Markdown to render a limited subset of form
elements--text fields, radio buttons, checkboxes, and select dropdowns. The
general form is:

```
question = answer(s)
```

The selected answer is saved into a database on the presenter's machine using
the question as an index. A few examples of different ways to render radio
buttons look like:

```
smartphone = () iPhone () Android () other -> Any other phone not listed

awake -> Are you paying attention? = (x) No () Yes

continent =
    () Africa
    () Americas
    () Asia
    () Australia
    () Europe
```

Notice that both the left and right hand side of the equal sign allow you to
specify either a `name`, or a `name -> human readable label` pair. The default
answer is preselected by marking it with a `x`. When the options are on a single
line, they are rendered side-by-side and when they're placed in an indented list
they are rendered as a bulleted list.

The presenter view can display live results of the answers and has the ability
to push those results to the projector to share the results with the audience.
The answers are all saved into `stats/forms.json` where other tools can process
the data as needed.

A rendered slide might look something like:

![Rendered form]({{ site.baseurl }}/assets/images/form.png)

The complete source for this slide looks like:

``` markdown
<!SLIDE form=classinfo>
# Making Acquaintances
## Let's get to know each other

Tell me a little bit about yourself to help me better tailor the classroom
experience towards your needs.

howlong -> How long have have you been using Puppet? = {
   under -> Less than six months
   6mo -> Around six months
   1yr -> About a year
   2yr -> Two years or so
   more -> Since before Puppet Enterprise was a sparkle in Luke's eye, get offa my lawn.
}

job -> What is your work role? =
    [] support -> Technical Support
    [] Sysadmin
    [] dbadmin -> DB Admin
    [] Developer
    [] Management

usedpe -> Have you used Puppet Enterprise? = () Yes () No

prepared -> Do you feel prepared for this class? = () Yes () No

~~~SECTION:notes~~~

Tell the class a little bit about yourself and your own background.

~~~FORM:classinfo~~~

~~~ENDSECTION~~~
```

After responses have been received, the presenter can push results to the projector. That will look a bit like this:

![Rendered results]({{ site.baseurl }}/assets/images/results.png)

Complete documentation is available on GitHub and I'd love it if you'd check it out!

```
[501:ben@ganymede] ~ $ gem update showoff
```
