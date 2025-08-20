{ pkgs ? import <nixpkgs> { config.allowUnfree = true; } }:

pkgs.mkShell {
  buildInputs = [
    pkgs.ffmpeg
    pkgs.python3
    pkgs.espeak
  ];
}
