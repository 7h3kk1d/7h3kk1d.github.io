import React from "react";
import { rhythm } from "../utils/typography";
import Layout from "../components/layout"
import { graphql } from 'gatsby'

const blogPost = ({ data }) => {
  const post = data.markdownRemark;
  return (
    <Layout title={post.frontmatter.title}>
      <div>
        <h1 style={{ display: `inline-block` }}>{post.frontmatter.title}</h1>
        <h4 style={{ marginBottom: rhythm(1 / 2), marginTop: rhythm(1 / 8), color: "#CCC" }}>{post.frontmatter.date}</h4>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>
    </Layout>
  );
};
export default blogPost;

export const query = graphql`
  query BlogPostQuery($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        date(formatString: "DD MMMM, YYYY")
      }
    }
  }
`;