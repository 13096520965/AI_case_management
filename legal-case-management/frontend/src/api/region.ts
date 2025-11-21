/**
 * 地区数据 API
 */

import request from './request'

export interface RegionItem {
  value: string
  label: string
  children?: RegionItem[]
}

/**
 * 获取全国省市区数据
 */
export const getRegions = () => {
  return request<{ data: RegionItem[] }>({
    url: '/regions',
    method: 'get'
  })
}

/**
 * 根据父级编码获取下级地区
 */
export const getRegionsByParent = (parentCode: string) => {
  return request<{ data: RegionItem[] }>({
    url: `/regions/${parentCode}`,
    method: 'get'
  })
}

export const regionApi = {
  getRegions,
  getRegionsByParent
}
