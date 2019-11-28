<script>
 var date = new Date().toISOString().split('T')[0];
 var text = "---
layout: post
title: "new post"
summary:
image:
category:
tags: []
---
"
</script>

# binford2k.com

This is the source for my [blog](https://binford2k.com). I started with
[Soot Spirits](https://github.com/abhn/Soot-Spirits) and then customized it by
drastically simplifying some bits and adding some magic of my own. The [tags page](https://binford2k.com/tags/)
started with [jQuery.prettyTag](https://github.com/CodeHimBlog/jquery.prettytag),
which I modified to add the `data-count` attribute and then sized each tag relatively
by this count.

Please feel free to file issues on this project if you find usability concerns
or submit a pull request to correct any content I get wrong.

Thanks!

<a href="https://github.com/binford2k/binford2k.com/new/master/tests?filename=_posts/<script>document.write(date);</script>-new-post.md&value=<script>document.write(text);</script>">Create new post</a>

### Credits
- [sootspirits.github.io](https://sootspirits.github.io) for the starter template
- [jQuery.prettyTag](https://github.com/CodeHimBlog/jquery.prettytag)
- [Bulma CSS](bulma.io/)

### Licence
MIT
