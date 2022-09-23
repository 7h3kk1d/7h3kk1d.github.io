import React from "react";
import Layout from "../components/layout";

export default () =>
    <Layout>
        <div>
            <h1>
                Curriculum Vitae
            </h1>
            <h2>Summary</h2>
            <p>
                {"Software Engineer seeking opportunities to pursue the future of computing via cutting edge technology and overlooked research. Particularly interested in utilizing the intersection of Programming Language Theory and Human-Computer Interaction to make the power of computing better for everyone. "}
            </p>
            <h2>Employment</h2>
            <h3>Senior Software Engineer, DRW Holdings (Reference Data)</h3>
            <h4 style={{ marginTop: 0 }}>April 2020-Present</h4>
            <ul>
                <li>Performing feature development, maintenance and support for dozens of polyglot services (Java, Ruby, Clojure, Python)</li>
                <li>Leading greenfield development of multiple projects while onboarding team on using functional abstractions in Java</li>
                <li>Work directly with Reference Data analysts on evolving the firm-wide domain model of financial instruments</li>
                <li>Led the first Ruby upgrade of firm’s internal Reference Data system in over 5 years with no major production outages</li>
                <li>Maintained multiple internal libraries for common infrastructural code</li>
                <li>Migrated build process to containers and began transition of services to Kubernetes</li>
            </ul>
            <h3>Software Engineer, DRW Holdings (Market Data)</h3>
            <h4 style={{ marginTop: 0 }}>May 2017-April 2020</h4>
            <ul>
                <li>Performed software archaeology to reverse engineer and document a poorly documented but critical system; this provided the firm with the ability to redeploy the system onto new infrastructure and allowed for feature improvements for the first time in years</li>
                <li>Participated in daily pair programming to upgrade reliability of streaming market data platform as well as onboarding additional exchanges and regularly performing in exchange protocol upgrades</li>
                <li>Built a custom ETL solution to import data from AWS S3 and allow for analyst defined data overrides with a custom UI written in React</li>
                <li>Led project to perform scheduled price capture from a variety of external services</li>
                <li>Performed ground-up rewrite of various services replacing the underlying database technology as well as altering the domain model from first principles</li>
                <li>Represented department in university recruiting initiative</li>
            </ul>
            <h3>Senior Software Engineer, OneMain Financial</h3>
            <h4 style={{ marginTop: 0 }}>November 2014-March 2017</h4>
            <ul>
                <li>Built a microservice architecture operating on the Ruby on Rails platform</li>
                <li>Worked closely with product managers, designers and UI engineers on a consumer oriented</li>
                <li>Developed secure authentication for API to API communication to keep data safe</li>
                <li>Built workflow management service that internal users used daily</li>
            </ul>
            <h3>Software Engineer, Telnyx</h3>
            <h4 style={{ marginTop: 0 }}>July 2013-November 2014</h4>
            <ul>
                <li>First employee who led development team after CTO exit while assuming full stack responsi-
bilities in a startup environment</li>
                <li>Set up automated deployments (Ansible) and notifications saving developers hours per day
and decreasing downtime</li>
            </ul>
        </div>
    </Layout>