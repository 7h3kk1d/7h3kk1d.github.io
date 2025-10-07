import React from "react";
const emailHash = "676e09788c1fd1edcb6ee1d7dcd3de163f1d2613f0bb9c6b46ea73356545367a"
export const about =   <div>
<h1>
  About Me
</h1>
<img src={"https://gravatar.com/avatar/" + emailHash +"?s=300"} alt="Gravatar Profile Pic" style={{ float: 'right', marginLeft: '20px', borderRadius: '50%' }}></img>
<p>
  I'm a researcher in the <a href="https://neurocy.notion.site/Future-of-Programming-Lab-241d162461a04064ae1fd9ae32bf4cb1">Future of Programming Lab</a> at the University of Michigan,
  where my work focuses on programming languages, specifically <a href="https://hazel.org/">Hazel</a>, a live functional programming language.
  I'm interested in utilizing the intersection of Programming Language Theory and Human-Computer Interaction to make the power of computing better for everyone.
  My long-term vision is to extend live programming into creating <a href="https://malleable.systems">malleable software</a> by integrating programming language structures into end-user interfaces.
  Before my research career, I worked as a professional software engineer for over a decade.
</p>
<p>
  Outside of my research, I’m a novice climber, always looking to improve and tackle new challenges.
</p>
</div>;

export default about;
