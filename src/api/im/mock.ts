import type {
  ChatMessage,
  Contact,
  Conversation,
  GroupMember,
  GroupRole,
  ImApi,
  ImFile,
  ImEvent,
  UploadReservation,
  UploadStatus,
} from '@/types/im'

/**
 * 内存 Mock：在后端聊天接口上线前用于联调界面（VITE_IM_MOCK=1）。
 * 行为刻意贴近 api.md：seq/eventSeq 为字符串、幂等 clientMessageId、expectedVersion 冲突、
 * 解散后只读、文件上传 → 安全检查 → 通过/拦截。
 */
export const MOCK_ME = '80001'
const NAMES: [string, string, string][] = [
  ['80001', '顾威', '技术部'],
  ['80002', '李敏', '装配车间'],
  ['80003', '王强', '仓储部'],
  ['80004', '陈晨', '生产计划'],
  ['80005', '周杰', '采购部'],
  ['80006', '赵琳', '装配车间'],
  ['80007', '孙浩', '质检部'],
  ['80008', '吴雪', '销售部'],
  ['80009', '郑凯', '设备维护'],
  ['80010', '林悦', '仓储部'],
]
const contacts: Contact[] = NAMES.map(([userId, displayName, departmentName]) => ({
  userId,
  displayName,
  departmentName,
}))
const nameOf = (id: string) => contacts.find((c) => c.userId === id)?.displayName ?? '未知员工'

interface Room {
  conv: Conversation
  members: { userId: string; role: GroupRole; joinedAt: string }[]
  messages: ChatMessage[]
}
const iso = (minutesAgo = 0) => new Date(Date.now() - minutesAgo * 60_000).toISOString()
let idSeed = 900000
const nextId = () => String(++idSeed)
let eventSeq = 1800

export function createMockImApi(delay = 120): ImApi {
  const rooms = new Map<string, Room>()
  const clientIndex = new Map<string, ChatMessage>()
  const uploads = new Map<
    string,
    { status: UploadStatus['status']; rejectionReason: string | null; conversationId: string; pending: ImFile }
  >()
  const listeners = new Set<(e: ImEvent) => void>()
  const wait = <T>(value: T, ms = delay) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))

  const emit = (type: ImEvent['type'], conversationId: string | null, payload: Record<string, unknown>) => {
    const event: ImEvent = {
      protocolVersion: 1,
      eventId: nextId(),
      eventSeq: String(++eventSeq),
      type,
      conversationId,
      occurredAt: iso(),
      payload,
    }
    listeners.forEach((l) => l(event))
  }

  const fail = (code: number, error: string, msg: string) =>
    Promise.reject(Object.assign(new Error(msg), { code, error }))

  const addMessage = (room: Room, senderId: string | null, init: Partial<ChatMessage>) => {
    const seq = String(Number(room.conv.lastSeq) + 1)
    const message: ChatMessage = {
      id: nextId(),
      conversationId: room.conv.id,
      seq,
      senderId,
      clientMessageId: init.clientMessageId ?? nextId(),
      type: 'TEXT',
      text: null,
      file: null,
      system: null,
      createdAt: iso(),
      ...init,
    }
    room.messages.push(message)
    room.conv.lastSeq = seq
    room.conv.lastMessage = message
    room.conv.updatedAt = message.createdAt
    if (senderId !== MOCK_ME && message.type !== 'SYSTEM') room.conv.unreadCount += 1
    if (senderId === MOCK_ME) room.conv.lastReadSeq = seq
    clientIndex.set(`${senderId}:${message.clientMessageId}`, message)
    emit('MESSAGE.CREATED', room.conv.id, { message })
    emit('CONVERSATION.UPDATED', room.conv.id, { conversation: { ...room.conv } })
    return message
  }

  const system = (room: Room, description: string, action: string) =>
    addMessage(room, null, { type: 'SYSTEM', system: { action, description } })

  const makeRoom = (
    conv: Partial<Conversation> & Pick<Conversation, 'id' | 'type' | 'name'>,
    members: [string, GroupRole][],
  ): Room => {
    const room: Room = {
      conv: {
        status: 'ACTIVE',
        ownerId: null,
        version: 1,
        memberCount: members.length,
        myRole: null,
        visibleFromSeq: '1',
        lastSeq: '0',
        lastReadSeq: '0',
        unreadCount: 0,
        muted: false,
        lastMessage: null,
        updatedAt: iso(),
        ...conv,
      },
      members: members.map(([userId, role]) => ({ userId, role, joinedAt: iso(600) })),
      messages: [],
    }
    rooms.set(room.conv.id, room)
    return room
  }

  // —— 初始数据 ——
  const g1 = makeRoom(
    { id: '110001', type: 'GROUP', name: '装配一组', ownerId: '80002', myRole: 'MEMBER', version: 3 },
    [
      ['80002', 'OWNER'],
      ['80001', 'MEMBER'],
      ['80006', 'MEMBER'],
      ['80007', 'ADMIN'],
    ],
  )
  const seed = (room: Room, rows: [string | null, Partial<ChatMessage>, number][]) =>
    rows.forEach(([sender, init, ago]) => {
      const m = addMessage(room, sender, init)
      m.createdAt = iso(ago)
      room.conv.updatedAt = m.createdAt
    })
  seed(g1, [
    [null, { type: 'SYSTEM', system: { action: 'GROUP_CREATED', description: '李敏 创建了群聊' } }, 1500],
    ['80002', { text: '今天的装配排产已经定了，大家看一下。' }, 1480],
    ['80006', { text: '收到，A 线 3 号工位缺一批轴承，仓库能补吗？' }, 1470],
    ['80001', { text: '我去跟仓库确认，十点前给你回复。' }, 1460],
    [
      '80002',
      {
        type: 'FILE',
        file: {
          id: '700001',
          name: '装配排产-11月.xlsx',
          size: 24681,
          mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      },
      90,
    ],
    ['80002', { type: 'IMAGE', file: { id: '700002', name: '3号工位现场.jpg', size: 812345, mime: 'image/jpeg' } }, 70],
    ['80006', { text: '看到了，现场确实少两托盘，先按图里的物料编码补。' }, 66],
    ['80002', { text: '工单资料已补齐' }, 63],
  ])
  g1.conv.lastReadSeq = '6'
  g1.conv.unreadCount = 2

  const d1 = makeRoom({ id: '110002', type: 'DIRECT', name: '王强', peerUserId: '80003' }, [
    ['80001', 'MEMBER'],
    ['80003', 'MEMBER'],
  ])
  seed(d1, [
    ['80001', { text: '王强，今天的成品入库单能在下午处理吗？' }, 40],
    ['80003', { text: '好的，下午三点前入库' }, 32],
  ])
  d1.conv.lastReadSeq = '2'
  d1.conv.unreadCount = 0

  const g2 = makeRoom(
    { id: '110003', type: 'GROUP', name: '仓储协同', ownerId: MOCK_ME, myRole: 'OWNER', version: 7, muted: true },
    [
      [MOCK_ME, 'OWNER'],
      ['80003', 'ADMIN'],
      ['80010', 'MEMBER'],
      ['80004', 'MEMBER'],
      ['80005', 'MEMBER'],
      ['80009', 'MEMBER'],
    ],
  )
  seed(g2, [
    [null, { type: 'SYSTEM', system: { action: 'GROUP_CREATED', description: '你创建了群聊' } }, 3000],
    ['80003', { text: '原料仓今早到货 36 件，已上架。' }, 120],
    ['80003', { type: 'IMAGE', file: { id: '700003', name: '到货现场.jpg', size: 640000, mime: 'image/jpeg' } }, 100],
  ])
  g2.conv.lastReadSeq = '1'
  g2.conv.unreadCount = 2

  const g3 = makeRoom(
    {
      id: '110005',
      type: 'GROUP',
      name: '采购审批沟通',
      status: 'DISSOLVED',
      ownerId: '80005',
      myRole: 'MEMBER',
      version: 5,
    },
    [
      ['80005', 'OWNER'],
      [MOCK_ME, 'MEMBER'],
      ['80008', 'MEMBER'],
    ],
  )
  seed(g3, [
    ['80005', { text: 'PO202609110008 的价格差异大家看一下。' }, 5000],
    [
      null,
      { type: 'SYSTEM', system: { action: 'GROUP_DISSOLVED', description: '群主已解散该群聊，仅可查看历史' } },
      4990,
    ],
  ])
  g3.conv.lastReadSeq = '2'
  g3.conv.unreadCount = 0
  void g2

  const mine = (room: Room) => room.members.find((m) => m.userId === MOCK_ME)

  const get = (id: string) => {
    const room = rooms.get(id)
    if (!room || !mine(room)) throw Object.assign(new Error('资源不存在'), { code: 404, error: 'RESOURCE_NOT_FOUND' })
    return room
  }

  const checkVersion = (room: Room, expected: number) => {
    if (room.conv.version !== expected)
      throw Object.assign(new Error('群信息已被他人修改，请刷新'), { code: 409, error: 'VERSION_CONFLICT' })
  }

  const writable = (room: Room) => {
    if (room.conv.status !== 'ACTIVE')
      throw Object.assign(new Error('该群已解散'), { code: 409, error: 'GROUP_NOT_WRITABLE' })
  }

  const bump = (room: Room, role?: GroupRole) => {
    room.conv.version += 1
    room.conv.memberCount = room.members.length
    if (role) room.conv.myRole = role
    emit('CONVERSATION.UPDATED', room.conv.id, { conversation: { ...room.conv } })
    return { ...room.conv }
  }

  const copy = (c: Conversation): Conversation => ({ ...c })

  const autoReply = (room: Room, text: string) => {
    const peer =
      room.conv.type === 'DIRECT' ? room.conv.peerUserId : room.members.find((m) => m.userId !== MOCK_ME)?.userId
    if (!peer || room.conv.status !== 'ACTIVE') return
    setTimeout(() => addMessage(room, peer, { text: `收到：${text.slice(0, 20)}` }), 1800)
  }

  return {
    config: () =>
      wait({
        maxFileBytes: 50_000_000,
        maxGroupMembers: 200,
        textMaxChars: 4000,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'xlsx', 'pptx', 'txt', 'csv', 'zip'],
      }),
    contacts: ({ keyword, limit = 100 }) => {
      const key = (keyword ?? '').trim()
      const rows = contacts.filter(
        (c) => c.userId !== MOCK_ME && (!key || `${c.displayName}${c.departmentName}`.includes(key)),
      )
      return wait({ records: rows.slice(0, limit), nextCursor: null, hasMore: false })
    },
    createDirect: (peer) => {
      let room = [...rooms.values()].find((r) => r.conv.type === 'DIRECT' && r.conv.peerUserId === peer)
      if (!room) {
        room = makeRoom({ id: nextId(), type: 'DIRECT', name: nameOf(peer), peerUserId: peer }, [
          [MOCK_ME, 'MEMBER'],
          [peer, 'MEMBER'],
        ])
        emit('CONVERSATION.UPDATED', room.conv.id, { conversation: { ...room.conv } })
      }
      return wait(copy(room.conv))
    },
    snapshot: () => {
      const records = [...rooms.values()].filter(mine).map((r) => copy(r.conv))
      return wait({
        records,
        snapshotToken: 'mock-snapshot',
        nextCursor: null,
        hasMore: false,
        syncEventSeq: String(eventSeq),
        totalUnreadCount: records.filter((c) => !c.muted).reduce((n, c) => n + c.unreadCount, 0),
        expiresAt: iso(-10),
      })
    },
    conversation: (id) => wait(copy(get(id).conv)),
    setPreferences: (id, muted) => {
      const room = get(id)
      room.conv.muted = muted
      emit('CONVERSATION.UPDATED', id, { conversation: { ...room.conv } })
      return wait({ muted })
    },
    sendMessage: async (id, input) => {
      const room = get(id)
      writable(room)
      const key = `${MOCK_ME}:${input.clientMessageId}`
      const existed = clientIndex.get(key)
      if (existed) {
        if ((existed.text ?? '') !== (input.text ?? ''))
          return fail(409, 'IDEMPOTENCY_CONFLICT', '相同发送标识对应不同内容')
        return wait({ message: existed, deduplicated: true, senderEventSeq: String(eventSeq) })
      }
      let file = null
      if (input.type !== 'TEXT') {
        const up = [...uploads.values()].find((u) => u.pending.id === input.fileId)
        if (!up || up.status !== 'READY') return fail(409, 'FILE_NOT_READY', '文件尚未通过检查')
        file = up.pending
      }
      const message = addMessage(room, MOCK_ME, {
        clientMessageId: input.clientMessageId,
        type: input.type,
        text: input.text ?? null,
        file,
      })
      if (input.text) autoReply(room, input.text)
      return wait({ message, deduplicated: false, senderEventSeq: String(eventSeq) })
    },
    history: (id, { beforeSeq, afterSeq, limit = 30 }) => {
      const room = get(id)
      let rows = room.messages.filter((m) => Number(m.seq) >= Number(room.conv.visibleFromSeq))
      if (afterSeq) rows = rows.filter((m) => Number(m.seq) > Number(afterSeq))
      else if (beforeSeq) rows = rows.filter((m) => Number(m.seq) < Number(beforeSeq))
      const page = afterSeq ? rows.slice(0, limit) : rows.slice(-limit)
      return wait({
        records: page,
        hasMore: afterSeq ? rows.length > limit : rows.length > limit,
        nextSeq: page.length ? (afterSeq ? page[page.length - 1]!.seq : page[0]!.seq) : null,
        direction: afterSeq ? 'FORWARD' : 'BACKWARD',
        latestSeq: room.conv.lastSeq,
      })
    },
    messageByClientId: (clientMessageId) => wait(clientIndex.get(`${MOCK_ME}:${clientMessageId}`) ?? null),
    markRead: (id, throughSeq) => {
      const room = get(id)
      room.conv.lastReadSeq = String(
        Math.max(Number(room.conv.lastReadSeq), Math.min(Number(throughSeq), Number(room.conv.lastSeq))),
      )
      room.conv.unreadCount = room.messages.filter(
        (m) => Number(m.seq) > Number(room.conv.lastReadSeq) && m.senderId !== MOCK_ME && m.type !== 'SYSTEM',
      ).length
      emit('READ.UPDATED', id, {
        conversationId: id,
        lastReadSeq: room.conv.lastReadSeq,
        unreadCount: room.conv.unreadCount,
      })
      return wait({ conversationId: id, lastReadSeq: room.conv.lastReadSeq, unreadCount: room.conv.unreadCount })
    },
    createGroup: ({ name, memberIds }) => {
      const room = makeRoom({ id: nextId(), type: 'GROUP', name, ownerId: MOCK_ME, myRole: 'OWNER', version: 1 }, [
        [MOCK_ME, 'OWNER'],
        ...memberIds.map((id) => [id, 'MEMBER'] as [string, GroupRole]),
      ])
      system(room, '你创建了群聊', 'GROUP_CREATED')
      room.conv.lastReadSeq = room.conv.lastSeq
      return wait(copy(room.conv))
    },
    renameGroup: (id, name, expected) => {
      const room = get(id)
      writable(room)
      checkVersion(room, expected)
      room.conv.name = name
      return wait(bump(room))
    },
    members: (id) => {
      const room = get(id)
      const records: GroupMember[] = room.members.map((m) => ({
        ...(contacts.find((c) => c.userId === m.userId) ?? { userId: m.userId, displayName: '未知员工' }),
        role: m.role,
        joinedAt: m.joinedAt,
      }))
      return wait({ records, nextCursor: null, hasMore: false, groupVersion: room.conv.version })
    },
    addMembers: (id, memberIds, expected) => {
      const room = get(id)
      writable(room)
      checkVersion(room, expected)
      for (const uid of memberIds) {
        if (room.members.some((m) => m.userId === uid)) return fail(409, 'MEMBER_ALREADY_PRESENT', '成员已在群中')
      }
      memberIds.forEach((uid) => room.members.push({ userId: uid, role: 'MEMBER', joinedAt: iso() }))
      system(room, `${nameOf(MOCK_ME)} 邀请 ${memberIds.map(nameOf).join('、')} 加入了群聊`, 'MEMBER_ADDED')
      return wait(bump(room))
    },
    removeMember: (id, userId, expected) => {
      const room = get(id)
      writable(room)
      checkVersion(room, expected)
      room.members = room.members.filter((m) => m.userId !== userId)
      system(room, `${nameOf(userId)} 被移出了群聊`, 'MEMBER_REMOVED')
      return wait(bump(room))
    },
    setRole: (id, userId, role, expected) => {
      const room = get(id)
      writable(room)
      checkVersion(room, expected)
      const member = room.members.find((m) => m.userId === userId)
      if (member) member.role = role
      return wait(bump(room))
    },
    transfer: (id, newOwnerId, expected) => {
      const room = get(id)
      writable(room)
      checkVersion(room, expected)
      room.members.forEach((m) => {
        if (m.userId === MOCK_ME) m.role = 'ADMIN'
        if (m.userId === newOwnerId) m.role = 'OWNER'
      })
      room.conv.ownerId = newOwnerId
      system(room, `${nameOf(MOCK_ME)} 将群主转让给 ${nameOf(newOwnerId)}`, 'OWNER_TRANSFERRED')
      return wait(bump(room, 'ADMIN'))
    },
    leave: (id, expected) => {
      const room = get(id)
      checkVersion(room, expected)
      if (room.conv.myRole === 'OWNER') return fail(409, 'OWNER_TRANSFER_REQUIRED', '请先转让群主')
      room.members = room.members.filter((m) => m.userId !== MOCK_ME)
      emit('CONVERSATION.REVOKED', id, { reason: 'LEFT' })
      return wait({ conversationId: id, version: room.conv.version + 1 })
    },
    dissolve: (id, expected) => {
      const room = get(id)
      writable(room)
      checkVersion(room, expected)
      room.conv.status = 'DISSOLVED'
      system(room, '群主已解散该群聊，仅可查看历史', 'GROUP_DISSOLVED')
      return wait(bump(room))
    },
    reserveUpload: (input) => {
      get(input.conversationId)
      const uploadId = nextId()
      uploads.set(uploadId, {
        status: 'INITIATED',
        rejectionReason: null,
        conversationId: input.conversationId,
        pending: { id: nextId(), name: input.name, size: input.size, mime: input.mime },
      })
      const reservation: UploadReservation = {
        uploadId,
        method: 'PUT',
        uploadUrl: `mock://upload/${uploadId}`,
        requiredHeaders: { 'Content-Type': input.mime },
        expiresAt: iso(-5),
        reservationExpiresAt: iso(-1440),
        maxFileBytes: 50_000_000,
      }
      return wait(reservation)
    },
    putFile: async (reservation, _file, onProgress, signal) => {
      for (let p = 10; p <= 100; p += 30) {
        if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
        await wait(null, 220)
        onProgress(Math.min(p, 100))
      }
      onProgress(100)
      void reservation
    },
    completeUpload: (uploadId) => {
      const up = uploads.get(uploadId)
      if (!up) return fail(404, 'RESOURCE_NOT_FOUND', '上传不存在')
      up.status = 'VERIFYING'
      const rejected = /受限|virus|\.exe$/i.test(up.pending.name)
      setTimeout(() => {
        if (up.status !== 'VERIFYING') return
        up.status = rejected ? 'REJECTED' : 'READY'
        up.rejectionReason = rejected ? '未通过安全检查，已拦截' : null
      }, 1500)
      return wait({ uploadId, status: 'VERIFYING', file: null, rejectionReason: null })
    },
    uploadStatus: (uploadId) => {
      const up = uploads.get(uploadId)
      if (!up) return fail(404, 'RESOURCE_NOT_FOUND', '上传不存在')
      const file = up.status === 'READY' ? up.pending : null
      return wait({ uploadId, status: up.status, file, rejectionReason: up.rejectionReason })
    },
    cancelUpload: (uploadId) => {
      const up = uploads.get(uploadId)
      if (up) up.status = 'CANCELLED'
      return wait({ uploadId, status: 'CANCELLED', file: null, rejectionReason: null })
    },
    downloadFile: () => wait(new Blob(['mock file content'], { type: 'text/plain' })),
    issueTicket: () =>
      wait({
        ticket: 'mock',
        expiresAt: iso(-1),
        websocketPath: '/ws/chat?ticket=mock',
        heartbeatSeconds: 30,
        idleTimeoutSeconds: 90,
      }),
    syncEvents: () =>
      wait({ records: [], nextAfterEventSeq: String(eventSeq), hasMore: false, highWatermark: String(eventSeq) }),
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
