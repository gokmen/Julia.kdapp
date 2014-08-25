#!/bin/bash

echo "Welcome to Julia Installer for Koding!"

OUT="/tmp/_juliainstaller.out"
mkdir -p $OUT

touch $OUT/"0-Asking for sudo password"
sudo add-apt-repository ppa:staticfloat/julia-deps -y &&

touch $OUT/"10-Adding julia repositories"
sudo add-apt-repository ppa:staticfloat/juliareleases -y &&
sudo add-apt-repository ppa:staticfloat/julianightlies -y &&

touch $OUT/"20-Updating system"
sudo apt-get update -y &&

touch $OUT/"30-Removing old packages"
sudo apt-get remove ipython julia -y &&

touch $OUT/"35-Installing development packages"
sudo apt-get install python-dev libpng12-dev libfreetype6-dev -y &&

touch $OUT/"50-Installing Python packages"
sudo apt-get install python-pip ipython python-numpy python-matplotlib python-zmq python-jinja2 python-tornado -y &&

touch $OUT/"70-Installing Julia"
sudo apt-get install julia -y &&

touch $OUT/"85-Updating IPython"
sudo pip install --upgrade ipython[all] &&

touch $OUT/"90-Configuring Julia"
julia -e 'Pkg.init(); Pkg.clone("https://github.com/staticfloat/Nettle.jl"); Pkg.add("IJulia"); Pkg.checkout("IJulia"); Pkg.add("PyPlot"); Pkg.add("Gadfly"); Pkg.checkout("JSON"); Pkg.fixup()' &&
sudo mkdir -p /.ipython/profile_default &&
(echo "from IPython.external.mathjax import install_mathjax"; echo "install_mathjax(dest=\"/.ipython/profile_julia/static/mathjax\")") | sudo python

touch $OUT/"100-Julia installation completed"
