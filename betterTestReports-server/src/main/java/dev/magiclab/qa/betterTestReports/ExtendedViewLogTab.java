package dev.magiclab.qa.betterTestReports;

import jetbrains.buildServer.serverSide.SBuild;
import jetbrains.buildServer.serverSide.SBuildServer;
import jetbrains.buildServer.web.openapi.*;
import org.jetbrains.annotations.NotNull;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

public class ExtendedViewLogTab extends jetbrains.buildServer.web.openapi.ViewLogTab {
    /**
     * Creates and registers tab for Build Results pages
     *
     * @param pagePlaces used to register the tab
     * @param server     server object
     */
    public ExtendedViewLogTab(@NotNull PluginDescriptor pluginDescriptor, @NotNull PagePlaces pagePlaces, @NotNull SBuildServer server) {
        super("Tests Overview", "betterTestReports", pagePlaces, server);
        addCssFile(pluginDescriptor.getPluginResourcesPath("css/better.css"));
        addJsFile(pluginDescriptor.getPluginResourcesPath("js/better.js"));
        setIncludeUrl(pluginDescriptor.getPluginResourcesPath("ExtendedViewLog.jsp"));
    }

    @Override
    public boolean isAvailable(@NotNull HttpServletRequest request) {
        return true;
    }

    @Override
    protected void fillModel(@NotNull Map<String, Object> map, @NotNull HttpServletRequest httpServletRequest, @NotNull SBuild sBuild) {
       // void
    }
}
