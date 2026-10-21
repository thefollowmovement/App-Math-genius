#!/bin/bash
# Télécharge les visuels des mini-jeux (Higgsfield) dans docs/design/jeux/
set -e
cd ~/Sites/app-maths/docs/design/jeux
dl() { curl -sSfL -o "$1" "$2" && echo "ok $1"; }
dl fond-peche.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083505_18810732-833a-4c67-941e-b256c4cf3956.png
dl fond-pluie.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083508_90c3b06c-8415-4262-adba-abafdd02a046.png
dl fond-vol.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083506_e8ad9bea-f51f-418a-b47d-2bbf84ab6f07.png
dl gemme.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083511_30a57004-fba1-409e-b51c-701ab6ba6bab.png
dl croquettes.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083506_717cf3a6-f53e-461c-b61a-be7d23fc906e.png
dl bombe.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083510_240d4eea-82e7-443a-bab2-78d50c55462b.png
dl poisson.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083507_61c37e81-fc1f-4d4f-a5d1-d9148d32e015.png
dl bouchon.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083506_df5fb572-8663-430e-9280-6281b3d0aa78.png
dl pilier-nuage.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083509_d1b4d087-0708-4594-97bf-cd5bba5e4979.png
dl bulle.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083509_1e8e43b0-869f-4ce5-a11d-28a1660fd875.png
dl coeur.png https://d8j0ntlcm91z4.cloudfront.net/user_33ulPvnXUa09y28hwu9he051boM/hf_20261021_083511_eca77e55-c064-40bf-b22a-eba76a468bdc.png
echo "11 visuels téléchargés"
