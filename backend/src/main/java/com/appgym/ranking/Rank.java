package com.appgym.ranking;

/**
 * Um degrau da escada.
 *
 * @param index posição na escada, de 0 (o mais baixo) para cima
 * @param key identifica o rank, para o brasão
 * @param division 1 a 3, ou 0 nos ranks sem divisão
 * @param floor pontos para chegar aqui
 */
public record Rank(int index, String key, String name, int division, String label, int floor) {}
