import { defineStore } from 'pinia'
import { ipcRenderer } from 'electron'
import log from 'electron-log'
import bus from '../bus'
import staticCommands, { RootCommand } from '../commands'

export const useCommandCenterStore = defineStore('commandCenter', {
  state: () => ({
    rootCommand: new RootCommand(staticCommands)
  }),

  actions: {
    registerCommand (command) {
      this.rootCommand.subcommands.push(command)
    },

    sortCommands () {
      this.rootCommand.subcommands.sort((a, b) => a.description.localeCompare(b.description))
    },

    listenCommandCenterBus () {
      // Init stuff
      bus.$on('cmd::sort-commands', () => {
        this.sortCommands()
      })
      ipcRenderer.on('mt::keybindings-response', (e, keybindingMap) => {
        const { subcommands } = this.rootCommand
        for (const entry of subcommands) {
          const value = keybindingMap[entry.id]
          if (value) {
            entry.shortcut = normalizeAccelerator(value)
          }
        }
      })

      // Register commands that are created at runtime.
      bus.$on('cmd::register-command', command => {
        this.registerCommand(command)
      })

      // Allow other compontents to execute commands with predefined values.
      bus.$on('cmd::execute', commandId => {
        this.executeCommand(commandId)
      })
      ipcRenderer.on('mt::execute-command-by-id', (e, commandId) => {
        this.executeCommand(commandId)
      })
    },

    executeCommand (commandId) {
      const { subcommands } = this.rootCommand
      const command = subcommands.find(c => c.id === commandId)
      if (!command) {
        const errorMsg = `Cannot execute command "${commandId}" because it's missing.`
        log.error(errorMsg)
        throw new Error(errorMsg)
      }
      command.execute()
    }
  }
})

const normalizeAccelerator = acc => {
  try {
    return acc
      .replace(/cmdorctrl|cmd/i, 'Cmd')
      .replace(/ctrl/i, 'Ctrl')
      .split('+')
  } catch (_) {
    return [acc]
  }
}
