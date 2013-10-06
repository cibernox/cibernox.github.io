---
layout: post
title: "Benchmarking the ruby 2.1 and rubinius 2.0"
date: 2013-10-05 20:33
comments: true
published: true
categories: ruby
keywords: ruby,mri,rubinius,jruby,ruby 2.1,benchmark,performance
description: "Benchmark the latests versions of the main ruby implementations. Battle: ruby-2.0 vs ruby-2.1 vs jruby-1.7.4 vs rbx-2.0"
---
<script src="{{ root_url }}/javascripts/ruby-benchmark-table.js" type="text/javascript"> </script>

A few days ago a the first preview version of ruby 2.1 was released.

It has many interesting improvements in the language, but the key ones are:

* Refinements
* Decimal Literals
* Frozen string literals
* Required keyword arguments
* Method definition returns Method Name
* String#scrub
* Named captures in StringScanner


Some of this improvements are more exciting than others (thubs up to fronzen string, thumbs down to refinements),
but as Yukuhiro Matsumoto said in his talk at the [Baruco](http://baruco.org/), which I attended, the main changes in this new release are
internal, with the new generational garbage collector as the king of the party.

I don't want to repeat content on the web, Konstantin Haase already wrote a great article explaining all the new features.
[Check it out](http://rkh.im/ruby-2.1) for more detailed information.

It promises better memory handling and lower GC runtime, which its suposed to lead to better overall performance.

I was curious about the numbers but I had not found any updated benchmark out there, so I run the benchmark myself to see it with my own eyes.

For that task, I used the popular [ruby-benchmark-suite](https://github.com/acangiano/ruby-benchmark-suite), which is quite old but has
lots of tests and has become almost a standard.

The benchmark was run in my 2012 macbook air, with a core i7 2.0GHZ (2 physical core, 4 logical cores due to hyperthreading)
and 8GB of ram. It takes about 25 minutes per implementation, just in case you want to run it too.

Just to clarify some details about how I performed the calculation in the bottom of the table, when I sumarize the
victories I just count the victories of each implementation, so raising an exception is a failure, but when measuring the total
time, if any of the implementations failed on that benchmark then its time is not computed in the total time of any implemetation.

Thesee are the results of the three MRI implementations:

<div id="table-ruby-mri-benchmark-placeholder"></div>

From this results we can say that, in general, ruby 2.1 is faster. It is the fastest implementation in
more tests than 1.9 and 2.0 together, even considering that it fails in some benchmarks.

The total time taken by ruby 2.1 is also noticeable lower. Is about a 23% lower than 2.0 and a 27% lower whan 1.9.3.
As I see, the main reason of this huge diference is that some specific tasks, ruby 2.1 is several times faster than
previous implementations, by example in the  `micro/bm_gc_array.rb` benchmark there is a 500% performance gain.

Probably in real word examples the performance gain will be around 5%, which is anyway a significant improvement.

But it turns out that 2 days ago, while I was writting this post rubinius 2.0 [was released](http://rubini.us/2013/10/04/rubinius-2-0-released/).

Rubinius is by far my favourite alternative ruby implementation and I was excited about that anouncement.
How will rubinius perform agains the other implementations? And jruby?

I've run the same benchmark against `rbx-2.0.0` working in ruby 2.1 mode and also agains `jruby 1.7.4` running on java 1.7.0_40-b43,
but in this case in ruby 2.0 mode.

All the cutting edge versions avaliable right now.

<div id="table-ruby-all-benchmark-placeholder"></div>

Wow!! I didn't expect that. Rubinius wins in twice as many tests as the second one (ruby 2.1) and also beats jruby
in all the multithreaded tests.

Both, jruby and rubinius outperforms MRI's implementations by an order of magnitude when it comes to parallel processing, that
was expected, but rubinius also doubles the performance on other matematicas tasks.
And jruby also performs very well, and probably would perform better in a computer with more than 2 cores.

Even if ruby 2.1 has the lower total time, this benchmark suite was written 4 years go. The computer world have changed since then.
Parallel computing is now the present, and I think that both rubinius and jruby have a brilliang future when it comes
to scale our application to the multi-core world we live now.





