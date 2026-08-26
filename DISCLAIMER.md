# Disclaimer — Authorized Use Only

QuadCore SQLi is a SQL-injection testing toolkit built for **authorized security
testing and research**: penetration testing engagements, security audits, CTFs,
and testing against systems you own or operate.

## You must have authorization

Only use this tool against:

- systems you personally own, or
- systems for which you have obtained **explicit, written authorization** from
  the owner or operator to perform security testing (e.g. a signed penetration
  testing agreement, a bug-bounty program's published scope, or equivalent
  written consent).

Scanning, probing, or extracting data from any other system — including
systems you merely have access to, or believe to be insecure — is illegal in
most jurisdictions and is **not** a permitted use of this software.

You are solely responsible for verifying that your use of this tool complies
with the law in your jurisdiction and the jurisdiction of the target system,
and with any contract, terms of service, or scope document governing your
testing engagement.

## No warranty, no liability

This software is provided "as is", without warranty of any kind, express or
implied, including but not limited to warranties of merchantability, fitness
for a particular purpose, and non-infringement.

In no event shall the authors or copyright holders be liable for any claim,
damages, or other liability — whether in an action of contract, tort, or
otherwise — arising from, out of, or in connection with the software, its use
of misuse, or the actions of anyone using it, including any unauthorized,
unlawful, or destructive use against systems the user was not authorized to
test.

The default configuration (binding to `127.0.0.1`, no exposed credentials,
etc.) reduces accidental exposure of the tool itself, but does **not** change
the fact that using it against a target requires that target owner's
authorization.

## License

This project is licensed under the **GNU General Public License v3.0 or
later (GPL-3.0-or-later)**. See [`LICENSE`](LICENSE) for the full text. The
license governs your rights to use, copy, modify, and redistribute the
software; it does not grant, and cannot grant, permission to test any system
you do not own or are not authorized to test.

## Legacy archive

The `legacy/` directory contains an older (2017) PHP/AngularJS version of this
tool, kept for historical reference only. It is unmaintained, untested against
modern PHP/MySQL versions, and should not be deployed. The same authorized-use
and no-liability terms above apply to it.
