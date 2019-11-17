---
layout: post
title: "Python DB-API is terrible, or how to return dictionaries from a database query"
image:
category:
tags: [deprecated, python, hacks]
---
Do you, like me, pull out your hair and get the almost irresistible urge to
murder small cute things when forced to use Python's DB-API? Despite being under
development for many years it seems to be half-baked at best.

One such idiocy would be the utter lack of dictionary support, the ability that
pretty much every other database abstraction layer since, well...forever, has
had to allow you to address the columns by name. E.g., `print row['firstName']`.

The [mysql driver](http://www.kitebird.com/articles/pydbapi.html) allows it, but
you have to CLOSE your cursor and open it in dictionary mode. Pardon my explosive
interjection here, but WTF?

I've written a dinky little wrapper that allows you to use dictionaries in your
project:

``` python
class MyClass:
    def __init__(self, ...):
        self.conn = pgdb.connect(...)
        self.cursor = self.conn.cursor()
        self.cursor.fetchoneAssoc = self.fetchoneAssoc
        self.cursor.fetchallAssoc = self.fetchallAssoc

    ## helper functions to make DB-API less braindead
    #
    def fetchoneAssoc(self):
        row = self.cursor.fetchone()
        if row is None: return None
        cols = [ d[0] for d in self.cursor.description ]
        return dict(zip(cols, row))

    def fetchallAssoc(self):
        results = self.cursor.fetchall()
        if results is None: return None
        cols = [ d[0] for d in self.cursor.description ]
        ret = []
        for row in results:
            ret.append(dict(zip(cols, row)))
        return ret
```

Just stick that in your class definition (obviously substituting the name of the
DB-API driver you're using), and call it just like you would a `.fetchall()`.

``` python
results = self.cursor.fetchallAssoc()
```

Now if you'll excuse me, I've got to go find a kitten. This is just too much.
